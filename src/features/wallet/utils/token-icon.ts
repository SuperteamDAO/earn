// Token icons as Earn's token list serves them (normalizeTokenIcon in
// src/server/tokenList.ts): remote images go through Earn's icon proxy, so
// the page's CSP needs no outside image hosts.

const DEFAULT_TOKEN_ICON = '/assets/dollar.svg';
const TOKEN_ICON_PROXY_PATH = '/api/token-icon';

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
    const appPath = joinUrlParts(url.pathname, url.search, url.hash);
    return normalizeCdnPathToProxyPath(appPath) ?? appPath;
  }

  return normalizeRemoteIconToProxyPath(url.toString());
}
