'use client';

import { type ReactNode, useEffect, useSyncExternalStore } from 'react';

export interface Token {
  tokenName: string;
  tokenSymbol: string;
  mintAddress: string;
  icon: string;
  decimals: number;
  sortOrder?: number;
  isActive?: boolean;
}

type TokenListApiResponse = {
  tokens: Token[];
};

const DEFAULT_TOKEN_ICON = '/assets/dollar.svg';

const listeners = new Set<() => void>();

let tokenListState: Token[] = [];
let tokenListPromise: Promise<Token[]> | null = null;

const notifyListeners = () => {
  for (const listener of listeners) {
    listener();
  }
};

export let tokenList: Token[] = [];

export const setTokenList = (tokens: Token[]) => {
  tokenListState = tokens;
  tokenList = tokens;
  notifyListeners();
};

export const getTokenListSnapshot = () => tokenListState;

export const subscribeToTokenList = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export async function loadTokenList(force = false): Promise<Token[]> {
  if (!force && tokenListState.length > 0) {
    return tokenListState;
  }

  if (!force && tokenListPromise) {
    return tokenListPromise;
  }

  tokenListPromise = fetch('/api/tokens', {
    credentials: 'same-origin',
    cache: 'no-store',
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error('Failed to load token metadata');
      }

      const data = (await response.json()) as TokenListApiResponse;
      const tokens = Array.isArray(data.tokens) ? data.tokens : [];
      setTokenList(tokens);
      return tokens;
    })
    .finally(() => {
      tokenListPromise = null;
    });

  return tokenListPromise;
}

export const getTokenBySymbolSync = (symbol?: string | null) =>
  tokenListState.find((token) => token.tokenSymbol === symbol);

export const getTokenByMintAddressSync = (mintAddress?: string | null) =>
  tokenListState.find((token) => token.mintAddress === mintAddress);

export async function getTokenBySymbol(symbol?: string | null) {
  if (!symbol) return undefined;
  const existingToken = getTokenBySymbolSync(symbol);
  if (existingToken) return existingToken;

  const tokens = await loadTokenList();
  return tokens.find((token) => token.tokenSymbol === symbol);
}

export async function getTokenByMintAddress(mintAddress?: string | null) {
  if (!mintAddress) return undefined;
  const existingToken = getTokenByMintAddressSync(mintAddress);
  if (existingToken) return existingToken;

  const tokens = await loadTokenList();
  return tokens.find((token) => token.mintAddress === mintAddress);
}

export const getTokenIcon = (symbol: string): string =>
  getTokenBySymbolSync(symbol)?.icon ?? DEFAULT_TOKEN_ICON;

export function useTokenList(): Token[] {
  const tokens = useSyncExternalStore(
    subscribeToTokenList,
    getTokenListSnapshot,
    getTokenListSnapshot,
  );

  useEffect(() => {
    void loadTokenList();
  }, []);

  return tokens;
}

export const useToken = (symbol?: string | null) => {
  const tokens = useTokenList();
  return tokens.find((token) => token.tokenSymbol === symbol);
};

export const useTokenByMintAddress = (mintAddress?: string | null) => {
  const tokens = useTokenList();
  return tokens.find((token) => token.mintAddress === mintAddress);
};

export function useTokenLookup() {
  const tokens = useTokenList();

  return {
    tokens,
    getBySymbol: (symbol?: string | null) =>
      tokens.find((token) => token.tokenSymbol === symbol),
    getByMintAddress: (mintAddress?: string | null) =>
      tokens.find((token) => token.mintAddress === mintAddress),
    getIcon: (symbol?: string | null) =>
      tokens.find((token) => token.tokenSymbol === symbol)?.icon ??
      DEFAULT_TOKEN_ICON,
  };
}

export const useTokenIcon = (symbol?: string | null) =>
  useToken(symbol)?.icon ?? DEFAULT_TOKEN_ICON;

export function TokenListProvider({ children }: { children: ReactNode }) {
  useTokenList();
  return children;
}
