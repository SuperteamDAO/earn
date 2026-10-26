'use client';

import { useEffect, useState } from 'react';

import { loadTokenList } from '@/constants/tokenList';
import { getJson } from '@/lib/fetch-json';

const STALE_MS = 1000 * 60 * 5;
const cache = new Map<string, { at: number; price: number }>();

// A token's dollar price, from Earn's /api/wallet/price/.
export async function fetchTokenUsdValue(mintAddress: string) {
  const cached = cache.get(mintAddress);
  if (cached && Date.now() - cached.at < STALE_MS) return cached.price;
  const { price } = await getJson<{ price: number }>(
    `/api/wallet/price/?mintAddress=${encodeURIComponent(mintAddress)}`,
  );
  cache.set(mintAddress, { at: Date.now(), price });
  return price;
}

// The price of the token with this symbol; undefined until known.
export function useTokenUsdValue(tokenSymbol?: string | null) {
  const [known, setKnown] = useState<{
    symbol: string;
    price: number | undefined;
  } | null>(null);

  useEffect(() => {
    if (!tokenSymbol) return undefined;
    let current = true;
    void (async () => {
      const tokens = await loadTokenList();
      const mintAddress = tokens.find(
        (token) => token.tokenSymbol === tokenSymbol,
      )?.mintAddress;
      if (!mintAddress) return;
      const price = await fetchTokenUsdValue(mintAddress);
      if (current) setKnown({ symbol: tokenSymbol, price });
    })().catch(() => {
      if (current) setKnown({ symbol: tokenSymbol, price: undefined });
    });
    return () => {
      current = false;
    };
  }, [tokenSymbol]);

  return tokenSymbol && known?.symbol === tokenSymbol ? known.price : undefined;
}
