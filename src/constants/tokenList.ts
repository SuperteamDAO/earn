'use client';

import {
  createContext,
  createElement,
  type ReactNode,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react';

export interface Token {
  tokenName: string;
  tokenSymbol: string;
  mintAddress: string;
  icon: string;
  decimals: number;
  sortOrder?: number;
  isActive?: boolean;
  isVerifiedOnJupiter: boolean;
}

type TokenListApiResponse = {
  tokens: Token[];
};

const DEFAULT_TOKEN_ICON = '/assets/dollar.svg';

// The tokens the root layout loaded on the server: what server rendering
// and hydration read, before (or instead of) the browser's own list.
const ServerTokens = createContext<Token[]>([]);

const listeners = new Set<() => void>();

// The browser's list: seeded from the server's, grown by tokens a sponsor
// adds (addTokenToList). Never written on the server, where it would be
// shared between requests.
let tokenListState: Token[] = [];
let tokenListPromise: Promise<Token[]> | null = null;

const notifyListeners = () => {
  for (const listener of listeners) {
    listener();
  }
};

const setTokenList = (tokens: Token[]) => {
  tokenListState = tokens;
  notifyListeners();
};

export const addTokenToList = (token: Token) => {
  const existingTokenIndex = tokenListState.findIndex(
    (currentToken) => currentToken.mintAddress === token.mintAddress,
  );

  if (existingTokenIndex >= 0) {
    const nextTokens = [...tokenListState];
    nextTokens[existingTokenIndex] = token;
    setTokenList(nextTokens);
    return;
  }

  setTokenList([...tokenListState, token]);
};

const subscribeToTokenList = (listener: () => void) => {
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

  tokenListPromise = fetch('/api/tokens/', {
    credentials: 'same-origin',
    cache: 'no-store',
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error('Failed to load token metadata');
      }

      const data: unknown = await response.json();
      const tokens =
        typeof data === 'object' &&
        data !== null &&
        'tokens' in data &&
        Array.isArray(data.tokens)
          ? // Earn's own /api/tokens/ answer.
            // oxlint-disable-next-line typescript/no-unsafe-type-assertion
            (data.tokens as TokenListApiResponse['tokens'])
          : [];
      setTokenList(tokens);
      return tokens;
    })
    .finally(() => {
      tokenListPromise = null;
    });

  return tokenListPromise;
}

const getTokenBySymbolSync = (symbol?: string | null) =>
  tokenListState.find((token) => token.tokenSymbol === symbol);

export async function getTokenBySymbol(symbol?: string | null) {
  if (!symbol) return undefined;
  const existingToken = getTokenBySymbolSync(symbol);
  if (existingToken) return existingToken;

  const tokens = await loadTokenList();
  return tokens.find((token) => token.tokenSymbol === symbol);
}

export function useTokenList(): Token[] {
  const serverTokens = useContext(ServerTokens);
  const tokens = useSyncExternalStore(
    subscribeToTokenList,
    () => (tokenListState.length > 0 ? tokenListState : serverTokens),
    () => serverTokens,
  );

  useEffect(() => {
    // Pages the server didn't hand a list to (the Pages Router) fetch it.
    if (serverTokens.length === 0) void loadTokenList();
  }, [serverTokens]);

  return tokens;
}

export const useToken = (symbol?: string | null) => {
  const tokens = useTokenList();
  return tokens.find((token) => token.tokenSymbol === symbol);
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

// The root layout passes the tokens it loaded (src/server/tokens.ts);
// without them the list is fetched in the browser.
export function TokenListProvider({
  tokens = [],
  children,
}: {
  tokens?: readonly Token[];
  children: ReactNode;
}) {
  // Seeds the browser's list once, before anything reads it.
  const [value] = useState(() => {
    const copy = [...tokens];
    if (
      typeof window !== 'undefined' &&
      copy.length > 0 &&
      tokenListState.length === 0
    ) {
      tokenListState = copy;
    }
    return copy;
  });
  return createElement(ServerTokens, { value }, children);
}
