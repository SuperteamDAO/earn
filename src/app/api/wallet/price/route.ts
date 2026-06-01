import { waitUntil } from '@vercel/functions';
import { NextResponse } from 'next/server';

import logger from '@/lib/logger';

interface PriceV3Response {
  [key: string]: {
    usdPrice: number;
    blockId: number;
    decimals: number;
    priceChange24h: number;
  };
}

const STABLE_MINTS = new Map<string, string>([
  ['EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', 'USDC'],
  ['Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', 'USDT'],
  ['2u1tszSeqZ3qBWF3uNGPFc8TzMk2tdiwknnRMWGWjGWH', 'USDG'],
]);

const STABLE_PRICE_LOWER_BOUND = 0.9;
const STABLE_PRICE_UPPER_BOUND = 1.1;

class PriceNotFoundError extends Error {}

async function fetchJupiterPrice(
  mintAddress: string,
  apiKey: string,
): Promise<number> {
  const baseUrl = 'https://api.jup.ag/price/v3';
  const response = await fetch(`${baseUrl}?ids=${mintAddress}`, {
    headers: { 'x-api-key': apiKey },
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as PriceV3Response;

  if (!data || !data[mintAddress]) {
    throw new PriceNotFoundError(
      `No price data found for token: ${mintAddress}`,
    );
  }

  return data[mintAddress].usdPrice;
}

async function flagStablePriceDrift(
  mintAddress: string,
  symbol: string,
  apiKey?: string,
) {
  if (!apiKey) return;

  try {
    const upstreamPrice = await fetchJupiterPrice(mintAddress, apiKey);
    if (
      upstreamPrice < STABLE_PRICE_LOWER_BOUND ||
      upstreamPrice > STABLE_PRICE_UPPER_BOUND
    ) {
      logger.warn('Stablecoin price drift detected', {
        token: symbol,
        mintAddress,
        upstreamPrice,
        expectedPrice: 1,
        lowerBound: STABLE_PRICE_LOWER_BOUND,
        upperBound: STABLE_PRICE_UPPER_BOUND,
      });
    }
  } catch (error) {
    logger.warn('Failed to check stablecoin upstream price', {
      token: symbol,
      mintAddress,
      error,
    });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mintAddress = searchParams.get('mintAddress');

    if (!mintAddress) {
      return NextResponse.json(
        { error: 'Mint address is required' },
        { status: 400 },
      );
    }

    const apiKey = process.env.JUPITER_API_KEY;
    const stableSymbol = STABLE_MINTS.get(mintAddress);
    if (stableSymbol) {
      waitUntil(flagStablePriceDrift(mintAddress, stableSymbol, apiKey));
      return NextResponse.json({ price: 1 });
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Jupiter API key is not configured' },
        { status: 500 },
      );
    }

    let price: number;
    try {
      price = await fetchJupiterPrice(mintAddress, apiKey);
    } catch (error) {
      if (error instanceof PriceNotFoundError) {
        return NextResponse.json(
          { error: `No price data found for token: ${mintAddress}` },
          { status: 404 },
        );
      }
      throw error;
    }

    return NextResponse.json({ price });
  } catch (error) {
    console.error('Error fetching token price:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token price' },
      { status: 500 },
    );
  }
}
