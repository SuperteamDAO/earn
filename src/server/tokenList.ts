import {
  IN_KIND_REWARD_ICON,
  IN_KIND_REWARD_TOKEN,
  isInKindReward,
} from '@/lib/rewards/inKind';
import { prisma } from '@/prisma';

export interface Token {
  tokenName: string;
  tokenSymbol: string;
  mintAddress: string;
  icon: string;
  decimals: number;
  sortOrder: number;
  isActive: boolean;
}

const DEFAULT_TOKEN_ICON = IN_KIND_REWARD_ICON;

const tokenSelect = {
  tokenName: true,
  tokenSymbol: true,
  mintAddress: true,
  icon: true,
  decimals: true,
  sortOrder: true,
  isActive: true,
} as const;

const PROXY_HOST_TO_PREFIX = new Map([
  ['s2.coinmarketcap.com', '/cdn/coinmarketcap'],
  ['bin.bnbstatic.com', '/cdn/bnbstatic'],
  ['statics.solscan.io', '/cdn/solscan'],
  ['assets.coingecko.com', '/cdn/coingecko'],
  ['avatars.githubusercontent.com', '/cdn/github'],
  ['api.phantom.app', '/cdn/phantom'],
  ['arweave.net', '/cdn/arweave'],
  ['ipfs.io', '/cdn/ipfs-io'],
  ['imagedelivery.net', '/cdn/imagedelivery'],
]);

const DIRECT_ALLOWED_HOSTS = new Set(['res.cloudinary.com', 'dl.airtable.com']);

const DIRECT_ALLOWED_HOST_SUFFIXES = [
  '.googleusercontent.com',
  '.airtableusercontent.com',
];

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

const isDirectlyAllowedHost = (hostname: string) =>
  DIRECT_ALLOWED_HOSTS.has(hostname) ||
  DIRECT_ALLOWED_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix));

const normalizeIpfsUrlToProxyPath = (url: URL) => {
  const hostname = url.hostname.toLowerCase();

  if (url.pathname.startsWith('/ipfs/')) {
    return `/cdn/ipfs-io${joinUrlParts(url.pathname, url.search, url.hash)}`;
  }

  for (const suffix of IPFS_SUBDOMAIN_SUFFIXES) {
    if (!hostname.endsWith(suffix)) continue;

    const cid = hostname.slice(0, -suffix.length);
    if (!cid) break;

    return `/cdn/ipfs-io/ipfs/${cid}${joinUrlParts(
      url.pathname,
      url.search,
      url.hash,
    )}`;
  }

  return null;
};

export function normalizeTokenIcon(icon?: string | null): string {
  const value = icon?.trim();
  if (!value) return DEFAULT_TOKEN_ICON;

  if (value.startsWith('/')) {
    if (value.startsWith('/cdn/') || value.startsWith('/assets/')) {
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
  const proxyPrefix = PROXY_HOST_TO_PREFIX.get(hostname);
  if (proxyPrefix) {
    return `${proxyPrefix}${joinUrlParts(url.pathname, url.search, url.hash)}`;
  }

  const ipfsProxyPath = normalizeIpfsUrlToProxyPath(url);
  if (ipfsProxyPath) {
    return ipfsProxyPath;
  }

  if (isDirectlyAllowedHost(hostname)) {
    return url.toString();
  }

  if (SAME_APP_HOSTS.has(hostname)) {
    return joinUrlParts(url.pathname, url.search, url.hash);
  }

  return DEFAULT_TOKEN_ICON;
}

const normalizeTokenRecord = <T extends Token>(token: T): T => ({
  ...token,
  icon: normalizeTokenIcon(token.icon),
});

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
  if (isInKindReward(tokenSymbol)) {
    return IN_KIND_REWARD_TOKEN as Token;
  }

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
  if (isInKindReward(tokenSymbol)) {
    return true;
  }
  const token = await getTokenBySymbol(tokenSymbol);
  return Boolean(token);
}
