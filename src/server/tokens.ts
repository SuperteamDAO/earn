import 'server-only';

import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Redacted from 'effect/Redacted';
import * as Schema from 'effect/Schema';

import * as AppConfig from '@/server/app-config';
import * as Database from '@/server/database';
import { isSafeRemoteUrl, safeRemoteFetch } from '@/utils/safeRemoteFetch';
import {
  MAX_TOKEN_ICON_SIZE_BYTES,
  sanitizeTokenIcon,
} from '@/utils/tokenIconImage';
import {
  sortJupiterTokenSearchResults,
  sortTokenSearchResults,
} from '@/utils/tokenSearch';

// A token sponsors can pay in (TokenMetadata), its icon routed through
// Earn's /api/token-icon/ proxy.
export interface Token {
  readonly tokenName: string;
  readonly tokenSymbol: string;
  readonly mintAddress: string;
  readonly icon: string;
  readonly decimals: number;
  readonly sortOrder: number;
  readonly isActive: boolean;
  readonly isVerifiedOnJupiter: boolean;
}

export interface JupiterToken {
  readonly id: string;
  readonly name: string;
  readonly symbol: string;
  readonly icon?: string | null;
  readonly decimals: number;
  readonly isVerified: boolean;
}

export class TokenRefused extends Schema.TaggedError<TokenRefused>()(
  'TokenRefused',
  {
    reason: Schema.Literals(['not-found', 'unverified', 'symbol-conflict']),
  },
) {
  override get message() {
    return `Token refused: ${this.reason}`;
  }
}

export class JupiterUnavailable extends Schema.TaggedError<JupiterUnavailable>()(
  'JupiterUnavailable',
  {},
) {
  override get message() {
    return 'Jupiter token search failed';
  }
}

// Why an icon can't be proxied, as the HTTP status Earn answered with.
export class IconRefused extends Schema.TaggedError<IconRefused>()(
  'IconRefused',
  { status: Schema.Literals([400, 404, 413, 415, 502]) },
) {
  override get message() {
    return `Token icon refused (${this.status})`;
  }
}

export interface Icon {
  readonly image: Buffer;
  readonly contentType: string;
}

export class Tokens extends Context.Service<
  Tokens,
  {
    // Active tokens, in Earn's order. Read on every page (the root layout
    // hands them to TokenListProvider), so kept for a minute.
    readonly list: Effect.Effect<ReadonlyArray<Token>, Database.DatabaseError>;
    // The token picker's search: Earn's own tokens, and Jupiter's.
    readonly search: (query: string) => Effect.Effect<
      {
        readonly tokens: ReadonlyArray<Token>;
        readonly jupiterTokens: ReadonlyArray<JupiterToken>;
      },
      Database.DatabaseError | JupiterUnavailable
    >;
    readonly bySymbol: (
      symbol: string | null | undefined,
      options?: { readonly includeInactive?: boolean },
    ) => Effect.Effect<Token | null, Database.DatabaseError>;
    // Adds a token Jupiter verifies, by its mint, for a sponsor to pay in.
    readonly addFromJupiter: (
      mintAddress: string,
    ) => Effect.Effect<
      Token,
      TokenRefused | JupiterUnavailable | Database.DatabaseError
    >;
    // A token's dollar price now (Jupiter), as Earn's /api/wallet/price
    // answers it; null when unknown.
    readonly usdPrice: (mintAddress: string) => Effect.Effect<number | null>;
    // A remote token icon, fetched safely and re-encoded.
    readonly icon: (
      rawUrl: string,
      png: boolean,
    ) => Effect.Effect<Icon, IconRefused>;
  }
>()('earn/Tokens') {}

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

const proxied = (url: string) =>
  `${TOKEN_ICON_PROXY_PATH}?url=${encodeURIComponent(url)}`;

const cdnProxied = (path: string) => {
  for (const [prefix, origin] of CDN_PREFIX_TO_REMOTE_ORIGIN) {
    if (path.startsWith(prefix)) {
      return proxied(`${origin}${path.slice(prefix.length)}`);
    }
  }
  return null;
};

const ipfsProxied = (url: URL) => {
  if (url.pathname.startsWith('/ipfs/')) return proxied(url.toString());
  const hostname = url.hostname.toLowerCase();
  for (const suffix of IPFS_SUBDOMAIN_SUFFIXES) {
    if (!hostname.endsWith(suffix)) continue;
    const cid = hostname.slice(0, -suffix.length);
    if (!cid) break;
    return proxied(
      `https://ipfs.io/ipfs/${cid}${url.pathname}${url.search}${url.hash}`,
    );
  }
  return null;
};

// Where a token's icon loads from: Earn's own assets as they are, anything
// remote through the icon proxy, and the dollar sign when there's none.
export function normalizeTokenIcon(icon?: string | null): string {
  const value = icon?.trim();
  if (!value) return DEFAULT_TOKEN_ICON;

  if (value.startsWith('/')) {
    const cdn = cdnProxied(value);
    if (cdn) return cdn;
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

  const url = URL.parse(value);
  if (!url || (url.protocol !== 'https:' && url.protocol !== 'http:')) {
    return DEFAULT_TOKEN_ICON;
  }
  if (url.protocol === 'http:') url.protocol = 'https:';

  const ipfs = ipfsProxied(url);
  if (ipfs) return ipfs;

  if (SAME_APP_HOSTS.has(url.hostname.toLowerCase())) {
    const path = `${url.pathname}${url.search}${url.hash}`;
    return cdnProxied(path) ?? path;
  }

  return proxied(url.toString());
}

const TOKEN = {
  tokenName: true,
  tokenSymbol: true,
  mintAddress: true,
  icon: true,
  decimals: true,
  sortOrder: true,
  isActive: true,
  isVerifiedOnJupiter: true,
} as const;

const normalized = (token: Token): Token => ({
  ...token,
  icon: normalizeTokenIcon(token.icon),
});

// Earn prices these at a dollar without asking.
const STABLE_MINTS: ReadonlySet<string> = new Set([
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  '2u1tszSeqZ3qBWF3uNGPFc8TzMk2tdiwknnRMWGWjGWH',
]);

const JupiterItem = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  symbol: Schema.String,
  icon: Schema.optional(Schema.NullOr(Schema.String)),
  decimals: Schema.Finite,
  isVerified: Schema.optional(Schema.NullOr(Schema.Boolean)),
});

const Quote = Schema.Record(
  Schema.String,
  Schema.Struct({ usdPrice: Schema.Finite }),
);

const LIST_FRESH_MS = 60_000;

const searchJupiter = (query: string) =>
  Effect.tryPromise({
    try: async () => {
      const response = await fetch(
        `https://api.jup.ag/tokens/v2/search?query=${encodeURIComponent(query)}`,
        { signal: AbortSignal.timeout(10_000) },
      );
      if (!response.ok) throw new Error(String(response.status));
      return (await response.json()) as unknown;
    },
    catch: () => new JupiterUnavailable(),
  }).pipe(
    Effect.map((body) =>
      (Array.isArray(body) ? body : []).flatMap((item: unknown) =>
        Option.toArray(Schema.decodeUnknownOption(JupiterItem)(item)),
      ),
    ),
    Effect.map((tokens) =>
      tokens.map((token): JupiterToken => ({
        id: token.id,
        name: token.name,
        symbol: token.symbol,
        icon: token.icon,
        decimals: token.decimals,
        isVerified: token.isVerified === true,
      })),
    ),
  );

const make = Effect.gen(function* () {
  const database = yield* Database.Database;
  const config = yield* AppConfig.AppConfig;

  let cached: { tokens: ReadonlyArray<Token>; at: number } | null = null;

  const list = Effect.gen(function* () {
    const now = yield* Clock.currentTimeMillis;
    if (cached && now - cached.at < LIST_FRESH_MS) return cached.tokens;
    const rows = yield* database.query('tokenList', (client) =>
      client.tokenMetadata.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { tokenSymbol: 'asc' }],
        select: TOKEN,
      }),
    );
    const tokens = rows.map(normalized);
    cached = { tokens, at: now };
    return tokens;
  }).pipe(Effect.withSpan('Tokens.list'));

  const bySymbol = Effect.fn('Tokens.bySymbol')(function* (
    symbol: string | null | undefined,
    options?: { readonly includeInactive?: boolean },
  ) {
    if (!symbol) return null;
    const row = yield* database.query('tokenBySymbol', (client) =>
      client.tokenMetadata.findFirst({
        where: {
          tokenSymbol: symbol,
          ...(options?.includeInactive ? {} : { isActive: true }),
        },
        select: TOKEN,
      }),
    );
    return row ? normalized(row) : null;
  });

  const search = Effect.fn('Tokens.search')(function* (raw: string) {
    const query = raw.trim();
    if (!query) return { tokens: yield* list, jupiterTokens: [] };
    const [rows, jupiter] = yield* Effect.all(
      [
        database.query('tokenSearch', (client) =>
          client.tokenMetadata.findMany({
            where: {
              isActive: true,
              OR: [
                { tokenName: { contains: query } },
                { tokenSymbol: { contains: query } },
                { mintAddress: { contains: query } },
              ],
            },
            orderBy: [{ sortOrder: 'asc' }, { tokenSymbol: 'asc' }],
            select: TOKEN,
            take: 100,
          }),
        ),
        searchJupiter(query),
      ],
      { concurrency: 2 },
    );
    return {
      tokens: sortTokenSearchResults(rows.map(normalized), query).slice(0, 25),
      jupiterTokens: sortJupiterTokenSearchResults(
        jupiter.map((token) => ({
          ...token,
          icon: normalizeTokenIcon(token.icon),
        })),
        query,
      ),
    };
  });

  const addFromJupiter = Effect.fn('Tokens.addFromJupiter')(function* (
    mintAddress: string,
  ) {
    const found = (yield* searchJupiter(mintAddress)).find(
      (token) => token.id === mintAddress,
    );
    if (!found) return yield* new TokenRefused({ reason: 'not-found' });
    if (!found.isVerified) {
      return yield* new TokenRefused({ reason: 'unverified' });
    }
    const sameSymbol = yield* bySymbol(found.symbol, { includeInactive: true });
    if (sameSymbol && sameSymbol.mintAddress !== found.id) {
      return yield* new TokenRefused({ reason: 'symbol-conflict' });
    }
    const last = yield* database.query('lastTokenSortOrder', (client) =>
      client.tokenMetadata.findFirst({
        orderBy: { sortOrder: 'desc' },
        select: { sortOrder: true },
      }),
    );
    const fields = {
      tokenName: found.name,
      tokenSymbol: found.symbol,
      icon: found.icon || DEFAULT_TOKEN_ICON,
      decimals: found.decimals,
      isActive: true,
      isVerifiedOnJupiter: true,
    };
    const row = yield* database.query('addJupiterToken', (client) =>
      client.tokenMetadata.upsert({
        where: { mintAddress: found.id },
        update: fields,
        create: {
          ...fields,
          mintAddress: found.id,
          sortOrder: (last?.sortOrder ?? 0) + 1,
        },
        select: TOKEN,
      }),
    );
    cached = null;
    return normalized(row);
  });

  const usdPrice = Effect.fn('Tokens.usdPrice')(function* (
    mintAddress: string,
  ) {
    if (STABLE_MINTS.has(mintAddress)) return 1;
    const key = config.jupiterApiKey;
    if (!key) return null;
    const body = yield* Effect.tryPromise(async () => {
      const response = await fetch(
        `https://api.jup.ag/price/v3?ids=${encodeURIComponent(mintAddress)}`,
        {
          headers: { 'x-api-key': Redacted.value(key) },
          signal: AbortSignal.timeout(5000),
        },
      );
      return response.ok ? ((await response.json()) as unknown) : null;
    }).pipe(Effect.orElseSucceed(() => null));
    return Schema.decodeUnknownOption(Quote)(body).pipe(
      Option.flatMap((prices) =>
        Option.fromNullishOr(prices[mintAddress]?.usdPrice),
      ),
      Option.getOrNull,
    );
  });

  const icon = Effect.fn('Tokens.icon')(function* (
    rawUrl: string,
    png: boolean,
  ) {
    const url = URL.parse(rawUrl);
    if (!url || !['https:', 'http:'].includes(url.protocol)) {
      return yield* new IconRefused({ status: 400 });
    }
    const safe = yield* Effect.tryPromise({
      try: () => isSafeRemoteUrl(url),
      catch: () => new IconRefused({ status: 502 }),
    });
    if (!safe) return yield* new IconRefused({ status: 400 });

    const response = yield* Effect.tryPromise({
      try: () =>
        safeRemoteFetch(url, {
          headers: {
            Accept: png
              ? 'image/png,image/jpeg,image/svg+xml,image/*;q=0.8'
              : 'image/avif,image/webp,image/png,image/jpeg,image/svg+xml,image/*',
          },
          maxRedirects: 4,
          timeoutMs: 5000,
          maxResponseBytes: MAX_TOKEN_ICON_SIZE_BYTES,
        }),
      catch: () => new IconRefused({ status: 502 }),
    });
    if (!response.ok) return yield* new IconRefused({ status: 404 });

    const contentType = response.headers.get('content-type') || '';
    if (
      Number(response.headers.get('content-length')) > MAX_TOKEN_ICON_SIZE_BYTES
    ) {
      return yield* new IconRefused({ status: 413 });
    }
    const image = Buffer.from(
      yield* Effect.tryPromise({
        try: () => response.arrayBuffer(),
        catch: () => new IconRefused({ status: 502 }),
      }),
    );
    if (image.byteLength > MAX_TOKEN_ICON_SIZE_BYTES) {
      return yield* new IconRefused({ status: 413 });
    }
    return yield* Effect.tryPromise({
      try: () => sanitizeTokenIcon(image, contentType, { forcePng: png }),
      catch: () => new IconRefused({ status: 415 }),
    });
  });

  return Tokens.of({
    list,
    search,
    bySymbol,
    addFromJupiter,
    usdPrice,
    icon,
  });
});

export const layer = Layer.effect(Tokens, make);
