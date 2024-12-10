import { type NextApiResponse } from 'next';

// NOTE: This supercedes react query, i.e react query canont override API Headers,
// good practice to not set stale time in react query call or keep it same as API header.

const enum CacheDirective {
  Public = 'public',
  Private = 'private',
  NoCache = 'no-cache',
  NoStore = 'no-store',
  MustRevalidate = 'must-revalidate',
  ProxyRevalidate = 'proxy-revalidate',
  Immutable = 'immutable',
  NoTransform = 'no-transform',
}

interface CacheControlOptions {
  // Cacheability
  public?: boolean; // Allow caching in both browsers and CDNs
  private?: boolean; // Allow caching only in browsers, not CDNs

  // No caching
  noCache?: boolean; // Cache exists but verifies with server every time
  noStore?: boolean; // Don't cache at all, fetch fresh every time

  // Freshness (in seconds)
  maxAge?: number; // How long browsers should keep cache without checking server
  sMaxAge?: number; // How long CDNs should keep cache without checking server

  // Stale content handling (in seconds)
  staleWhileRevalidate?: number; // Show old cache while fetching new data in background
  staleIfError?: number; // Show old cache if server fails to respond

  // Revalidation
  mustRevalidate?: boolean; // Force check with server when cache expires (both cdn and browser)
  proxyRevalidate?: boolean; // Force only CDNs to check with server when cache expires

  // Other directives
  immutable?: boolean; // Content won't change while cache is valid
  noTransform?: boolean; // Don't allow CDNs to modify the response
}

export function setCacheHeaders(
  res: NextApiResponse,
  options: CacheControlOptions = {},
): void {
  // Validate mutually exclusive options
  if (options.public && options.private) {
    throw new Error('Cannot set both public and private cache directives');
  }

  if (options.noStore && (options.maxAge || options.sMaxAge)) {
    throw new Error('Cannot set maxAge/sMaxAge with noStore directive');
  }

  const directives: string[] = [];

  // Basic directives
  if (options.public) directives.push(CacheDirective.Public);
  if (options.private) directives.push(CacheDirective.Private);
  if (options.noCache) directives.push(CacheDirective.NoCache);
  if (options.noStore) directives.push(CacheDirective.NoStore);

  // Time-based directives
  if (typeof options.maxAge === 'number' && options.maxAge >= 0) {
    directives.push(`max-age=${Math.floor(options.maxAge)}`);
  }
  if (typeof options.sMaxAge === 'number' && options.sMaxAge >= 0) {
    directives.push(`s-maxage=${Math.floor(options.sMaxAge)}`);
  }

  // Stale handling
  if (
    typeof options.staleWhileRevalidate === 'number' &&
    options.staleWhileRevalidate >= 0
  ) {
    directives.push(
      `stale-while-revalidate=${Math.floor(options.staleWhileRevalidate)}`,
    );
  }
  if (typeof options.staleIfError === 'number' && options.staleIfError >= 0) {
    directives.push(`stale-if-error=${Math.floor(options.staleIfError)}`);
  }

  // Validation directives
  if (options.mustRevalidate) directives.push(CacheDirective.MustRevalidate);
  if (options.proxyRevalidate) directives.push(CacheDirective.ProxyRevalidate);
  if (options.immutable) directives.push(CacheDirective.Immutable);
  if (options.noTransform) directives.push(CacheDirective.NoTransform);

  if (directives.length > 0) {
    res.setHeader('Cache-Control', directives.join(', '));
  }
}
