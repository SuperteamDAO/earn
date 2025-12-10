import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

import { publicApiRateLimiter } from '@/lib/ratelimit';
import { checkAndApplyRateLimitApp } from '@/lib/rateLimiterService';
import { getClientIP } from '@/utils/getClientIP';

interface PriceV3Response {
  [key: string]: {
    usdPrice: number;
    blockId: number;
    decimals: number;
    priceChange24h: number;
  };
}

const STABLE_MINTS = new Set<string>([
  // USDC
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  // USDT
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
]);

export async function GET(request: Request) {
  const requestHeaders = await headers();
  const clientIP = getClientIP(requestHeaders);

  const rateLimitResponse = await checkAndApplyRateLimitApp({
    limiter: publicApiRateLimiter,
    identifier: `wallet_price:${clientIP}`,
    routeName: 'wallet-price',
  });
  if (rateLimitResponse) return rateLimitResponse;
  try {
    const { searchParams } = new URL(request.url);
    const mintAddress = searchParams.get('mintAddress');

    if (!mintAddress) {
      return NextResponse.json(
        { error: 'Mint address is required' },
        { status: 400 },
      );
    }

    if (STABLE_MINTS.has(mintAddress)) {
      return NextResponse.json({ price: 1 });
    }

    const baseUrl = 'https://lite-api.jup.ag/price/v3';
    const response = await fetch(`${baseUrl}?ids=${mintAddress}`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as PriceV3Response;

    if (!data || !data[mintAddress]) {
      return NextResponse.json(
        { error: `No price data found for token: ${mintAddress}` },
        { status: 404 },
      );
    }

    const price = data[mintAddress].usdPrice;

    return NextResponse.json({ price });
  } catch (error) {
    console.error('Error fetching token price:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token price' },
      { status: 500 },
    );
  }
}
