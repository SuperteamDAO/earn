import 'server-only';

import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Redacted from 'effect/Redacted';
import * as Schema from 'effect/Schema';

import * as AppConfig from '@/server/app-config';

export const SOL_MINT = 'So11111111111111111111111111111111111111112';

// Earn prices these at a dollar without asking.
const STABLE_MINTS: ReadonlySet<string> = new Set([
  // USDC
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  // USDT
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  // USDG
  '2u1tszSeqZ3qBWF3uNGPFc8TzMk2tdiwknnRMWGWjGWH',
]);

// As Earn's price route cached Jupiter's answer.
const FRESH_MS = 60_000;

// No Jupiter key, or Jupiter didn't answer.
export class PriceUnavailable extends Schema.TaggedError<PriceUnavailable>()(
  'PriceUnavailable',
  { reason: Schema.Literals(['config', 'fetch']) },
) {
  override get message() {
    return `Token price unavailable (${this.reason})`;
  }
}

// Jupiter has no price for the token.
export class PriceNotFound extends Schema.TaggedError<PriceNotFound>()(
  'PriceNotFound',
  { mint: Schema.String },
) {
  override get message() {
    return `No price data found for token: ${this.mint}`;
  }
}

const PriceV3 = Schema.Record(
  Schema.String,
  Schema.Struct({ usdPrice: Schema.Finite }),
);

// A token's dollar price, from Jupiter's price API, as Earn's
// /api/wallet/price gives it.
export class WalletPrices extends Context.Service<
  WalletPrices,
  {
    readonly usd: (
      mint: string,
    ) => Effect.Effect<number, PriceUnavailable | PriceNotFound>;
  }
>()('earn/WalletPrices') {}

const make = Effect.gen(function* () {
  const config = yield* AppConfig.AppConfig;
  const cache = new Map<
    string,
    { readonly price: number; readonly at: number }
  >();

  const usd = Effect.fn('WalletPrices.usd')(function* (mint: string) {
    if (STABLE_MINTS.has(mint)) return 1;
    const key = config.jupiterApiKey;
    if (!key) return yield* new PriceUnavailable({ reason: 'config' });
    const now = yield* Clock.currentTimeMillis;
    const cached = cache.get(mint);
    if (cached && now - cached.at < FRESH_MS) return cached.price;

    const body = yield* Effect.tryPromise({
      try: async () => {
        const response = await fetch(
          `https://api.jup.ag/price/v3?ids=${encodeURIComponent(mint)}`,
          {
            headers: { 'x-api-key': Redacted.value(key) },
            signal: AbortSignal.timeout(10_000),
          },
        );
        if (!response.ok) throw new Error(`Jupiter ${response.status}`);
        return (await response.json()) as unknown;
      },
      catch: () => new PriceUnavailable({ reason: 'fetch' }),
    });
    const price = Schema.decodeUnknownOption(PriceV3)(body).pipe(
      Option.flatMap((prices) => Option.fromNullishOr(prices[mint]?.usdPrice)),
    );
    if (Option.isNone(price)) return yield* new PriceNotFound({ mint });
    cache.set(mint, { price: price.value, at: now });
    return price.value;
  });

  return WalletPrices.of({ usd });
});

export const layer = Layer.effect(WalletPrices, make);
