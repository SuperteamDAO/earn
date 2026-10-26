import 'server-only';

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Redacted from 'effect/Redacted';
import * as Schema from 'effect/Schema';

import * as AppConfig from '@/server/app-config';

// Earn's limits, with Earn's Upstash prefixes so counts carry over.
const LIMITS = {
  aiGenerate: {
    prefix: 'ai_generate',
    window: Ratelimit.fixedWindow(20, '1 m'),
  },
  userCreate: {
    prefix: 'user_create',
    window: Ratelimit.fixedWindow(60, '1 h'),
  },
  ogMetadata: {
    prefix: 'og_metadata',
    window: Ratelimit.fixedWindow(60, '1 m'),
  },
  ogImageUpdate: {
    prefix: 'og_image_update',
    window: Ratelimit.fixedWindow(30, '1 m'),
  },
  supportEmail: {
    prefix: 'support_email',
    window: Ratelimit.fixedWindow(5, '1 h'),
  },
  emailValidate: {
    prefix: 'email_validate',
    window: Ratelimit.slidingWindow(10, '1 m'),
  },
  emailValidateHourly: {
    prefix: 'email_validate_hourly',
    window: Ratelimit.fixedWindow(100, '1 h'),
  },
  reportListing: {
    prefix: 'report_listing',
    window: Ratelimit.fixedWindow(5, '1 h'),
  },
} as const;

export type Limit = keyof typeof LIMITS;

export class RateLimited extends Schema.TaggedError<RateLimited>()(
  'RateLimited',
  { limit: Schema.String, retryAfterSeconds: Schema.Finite },
) {
  override get message() {
    return `Rate limited: ${this.limit}`;
  }
}

export class RateLimits extends Context.Service<
  RateLimits,
  {
    // Counts one request by `identifier` (a user id or IP) against `limit`.
    // Without Upstash, or when Upstash can't be reached, it lets the
    // request through, as Earn did.
    readonly check: (
      limit: Limit,
      identifier: string,
    ) => Effect.Effect<void, RateLimited>;
  }
>()('earn/RateLimits') {}

const make = Effect.gen(function* () {
  const config = yield* AppConfig.AppConfig;
  const upstash = config.upstash;
  const redis = upstash
    ? new Redis({ url: upstash.url, token: Redacted.value(upstash.token) })
    : null;
  const limiters = new Map<Limit, Ratelimit>();
  const limiter = (limit: Limit, client: Redis) => {
    let found = limiters.get(limit);
    if (!found) {
      const { prefix, window } = LIMITS[limit];
      found = new Ratelimit({
        redis: client,
        limiter: window,
        analytics: true,
        prefix: `ratelimit:${prefix}`,
      });
      limiters.set(limit, found);
    }
    return found;
  };

  const check = Effect.fn('RateLimits.check')(function* (
    limit: Limit,
    identifier: string,
  ) {
    if (!redis) return yield* Effect.void;
    const result = yield* Effect.tryPromise(() =>
      limiter(limit, redis).limit(identifier),
    ).pipe(
      Effect.timeout('3 seconds'),
      Effect.catch(() =>
        Effect.logWarning('Rate limit check failed; allowed').pipe(
          Effect.annotateLogs({ limit }),
          Effect.as(null),
        ),
      ),
    );
    if (!result || result.success) return yield* Effect.void;
    return yield* new RateLimited({
      limit,
      retryAfterSeconds: Math.max(
        Math.ceil((result.reset - Date.now()) / 1000),
        1,
      ),
    });
  });

  return RateLimits.of({ check });
});

export const layer = Layer.effect(RateLimits, make);
