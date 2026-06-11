import { prisma } from '@/prisma';
import { sortTokenSearchResults } from '@/utils/tokenSearch';

export interface Token {
  tokenName: string;
  tokenSymbol: string;
  mintAddress: string;
  icon: string;
  decimals: number;
  sortOrder: number;
  isActive: boolean;
  isVerifiedOnJupiter: boolean;
}

export interface JupiterToken {
  id: string;
  name: string;
  symbol: string;
  icon?: string | null;
  decimals: number;
  isVerified: boolean;
}

export type AddVerifiedJupiterTokenResult =
  | {
      type: 'success';
      token: Token;
    }
  | {
      type: 'unverified-token';
    }
  | {
      type: 'symbol-conflict';
    };

const DEFAULT_TOKEN_ICON = '/assets/dollar.svg';
const TOKEN_ICON_PROXY_PATH = '/api/token-icon';

const tokenSelect = {
  tokenName: true,
  tokenSymbol: true,
  mintAddress: true,
  icon: true,
  decimals: true,
  sortOrder: true,
  isActive: true,
  isVerifiedOnJupiter: true,
} as const;

const SAME_APP_HOSTS = new Set([
  'superteam.fun',
  'www.superteam.fun',
  'earn.superteam.fun',
]);

const IPFS_SUBDOMAIN_SUFFIXES = [
  '.ipfs.nftstorage.link',
  '.ipfs.w3s.link',
  '.ipfs.dweb.link',
];

const joinUrlParts = (pathname: string, search: string, hash: string) =>
  `${pathname}${search}${hash}`;

const normalizeRemoteIconToProxyPath = (url: string) =>
  `${TOKEN_ICON_PROXY_PATH}?url=${encodeURIComponent(url)}`;

const normalizeIpfsUrlToProxyPath = (url: URL) => {
  const hostname = url.hostname.toLowerCase();

  if (url.pathname.startsWith('/ipfs/')) {
    return normalizeRemoteIconToProxyPath(url.toString());
  }

  for (const suffix of IPFS_SUBDOMAIN_SUFFIXES) {
    if (!hostname.endsWith(suffix)) continue;

    const cid = hostname.slice(0, -suffix.length);
    if (!cid) break;

    return normalizeRemoteIconToProxyPath(
      `https://ipfs.io/ipfs/${cid}${joinUrlParts(
        url.pathname,
        url.search,
        url.hash,
      )}`,
    );
  }

  return null;
};

const CDN_PREFIX_TO_REMOTE_ORIGIN = new Map([
  ['/cdn/coinmarketcap/', 'https://s2.coinmarketcap.com/'],
  ['/cdn/bnbstatic/', 'https://bin.bnbstatic.com/'],
  ['/cdn/solscan/', 'https://statics.solscan.io/'],
  ['/cdn/coingecko/', 'https://assets.coingecko.com/'],
  ['/cdn/github/', 'https://avatars.githubusercontent.com/'],
  ['/cdn/phantom/', 'https://api.phantom.app/'],
  ['/cdn/arweave/', 'https://arweave.net/'],
  ['/cdn/ipfs-io/', 'https://ipfs.io/'],
  ['/cdn/imagedelivery/', 'https://imagedelivery.net/'],
]);

const normalizeCdnPathToProxyPath = (path: string) => {
  for (const [prefix, remoteOrigin] of CDN_PREFIX_TO_REMOTE_ORIGIN) {
    if (!path.startsWith(prefix)) continue;

    return normalizeRemoteIconToProxyPath(
      `${remoteOrigin}${path.slice(prefix.length)}`,
    );
  }

  return null;
};

export function normalizeTokenIcon(icon?: string | null): string {
  const value = icon?.trim();
  if (!value) return DEFAULT_TOKEN_ICON;

  if (value.startsWith('/')) {
    const cdnProxyPath = normalizeCdnPathToProxyPath(value);
    if (cdnProxyPath) return cdnProxyPath;

    if (
      value.startsWith('/assets/') ||
      value.startsWith(`${TOKEN_ICON_PROXY_PATH}?`)
    ) {
      return value;
    }

    return DEFAULT_TOKEN_ICON;
  }

  if (value.startsWith('data:') || value.startsWith('blob:')) {
    return DEFAULT_TOKEN_ICON;
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return DEFAULT_TOKEN_ICON;
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return DEFAULT_TOKEN_ICON;
  }

  if (url.protocol === 'http:') {
    url.protocol = 'https:';
  }

  const hostname = url.hostname.toLowerCase();
  const ipfsProxyPath = normalizeIpfsUrlToProxyPath(url);
  if (ipfsProxyPath) {
    return ipfsProxyPath;
  }

  if (SAME_APP_HOSTS.has(hostname)) {
    return joinUrlParts(url.pathname, url.search, url.hash);
  }

  return normalizeRemoteIconToProxyPath(url.toString());
}

const normalizeTokenRecord = <T extends Token>(token: T): T => ({
  ...token,
  icon: normalizeTokenIcon(token.icon),
});

export async function searchTokenList(query: string): Promise<Token[]> {
  const search = query.trim();
  if (!search) return [];

  const tokens = await prisma.tokenMetadata.findMany({
    where: {
      isActive: true,
      OR: [
        { tokenName: { contains: search } },
        { tokenSymbol: { contains: search } },
        { mintAddress: { contains: search } },
      ],
    },
    orderBy: [{ sortOrder: 'asc' }, { tokenSymbol: 'asc' }],
    select: tokenSelect,
    take: 100,
  });

  return sortTokenSearchResults(tokens.map(normalizeTokenRecord), search).slice(
    0,
    25,
  );
}

export async function addVerifiedJupiterToken(
  jupiterToken: JupiterToken,
): Promise<AddVerifiedJupiterTokenResult> {
  if (!jupiterToken.isVerified) {
    return { type: 'unverified-token' };
  }

  const conflictingSymbolToken = await getTokenBySymbol(jupiterToken.symbol, {
    includeInactive: true,
  });

  if (
    conflictingSymbolToken &&
    conflictingSymbolToken.mintAddress !== jupiterToken.id
  ) {
    return { type: 'symbol-conflict' };
  }

  const maxSortOrderToken = await prisma.tokenMetadata.findFirst({
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  });

  const token = await prisma.tokenMetadata.upsert({
    where: { mintAddress: jupiterToken.id },
    update: {
      tokenName: jupiterToken.name,
      tokenSymbol: jupiterToken.symbol,
      icon: jupiterToken.icon || DEFAULT_TOKEN_ICON,
      decimals: jupiterToken.decimals,
      isActive: true,
      isVerifiedOnJupiter: true,
    },
    create: {
      tokenName: jupiterToken.name,
      tokenSymbol: jupiterToken.symbol,
      mintAddress: jupiterToken.id,
      icon: jupiterToken.icon || DEFAULT_TOKEN_ICON,
      decimals: jupiterToken.decimals,
      sortOrder: (maxSortOrderToken?.sortOrder ?? 0) + 1,
      isActive: true,
      isVerifiedOnJupiter: true,
    },
    select: tokenSelect,
  });

  return {
    type: 'success',
    token: normalizeTokenRecord(token),
  };
}

export async function getTokenList(options?: {
  includeInactive?: boolean;
}): Promise<Token[]> {
  const tokens = await prisma.tokenMetadata.findMany({
    where: options?.includeInactive ? undefined : { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { tokenSymbol: 'asc' }],
    select: tokenSelect,
  });

  return tokens.map(normalizeTokenRecord);
}

export async function getTokenBySymbol(
  tokenSymbol?: string | null,
  options?: {
    includeInactive?: boolean;
  },
): Promise<Token | null> {
  if (!tokenSymbol) return null;

  const token = await prisma.tokenMetadata.findFirst({
    where: {
      tokenSymbol,
      ...(options?.includeInactive ? {} : { isActive: true }),
    },
    select: tokenSelect,
  });

  return token ? normalizeTokenRecord(token) : null;
}

export async function getTokenByMintAddress(
  mintAddress?: string | null,
  options?: {
    includeInactive?: boolean;
  },
): Promise<Token | null> {
  if (!mintAddress) return null;

  const token = await prisma.tokenMetadata.findFirst({
    where: {
      mintAddress,
      ...(options?.includeInactive ? {} : { isActive: true }),
    },
    select: tokenSelect,
  });

  return token ? normalizeTokenRecord(token) : null;
}

export async function getTokenIcon(
  symbol?: string | null,
): Promise<string | null> {
  const token = await getTokenBySymbol(symbol, { includeInactive: true });
  return token?.icon ?? null;
}

export async function isActiveTokenSymbol(tokenSymbol?: string | null) {
  const token = await getTokenBySymbol(tokenSymbol);
  return Boolean(token);
}
