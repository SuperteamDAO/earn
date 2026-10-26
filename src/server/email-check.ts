import 'server-only';

import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Redacted from 'effect/Redacted';
import * as Schema from 'effect/Schema';

import * as AppConfig from '@/server/app-config';
import * as RateLimits from '@/server/rate-limits';

const Verdict = Schema.Struct({
  status: Schema.String,
  sub_status: Schema.optional(Schema.String),
});

// Whether an address can take a sign-in code, by ZeroBounce, before Privy
// sends one. Only Earn's production deployment asks; elsewhere, without a
// key, or when ZeroBounce fails, every address passes (fail open, so an
// outage never blocks sign-in).
export class EmailCheck extends Context.Service<
  EmailCheck,
  {
    readonly deliverable: (
      email: string,
      ip: string,
    ) => Effect.Effect<boolean, RateLimits.RateLimited>;
  }
>()('earn/EmailCheck') {}

const make = Effect.gen(function* () {
  const config = yield* AppConfig.AppConfig;
  const limits = yield* RateLimits.RateLimits;
  const key = config.zeroBounceApiKey;

  const deliverable = Effect.fn('EmailCheck.deliverable')(function* (
    email: string,
    ip: string,
  ) {
    if (!config.earnProduction || !key) return true;
    yield* limits.check('emailValidate', `ip:${ip}`);
    yield* limits.check('emailValidateHourly', `ip:${ip}`);
    const url = new URL('https://api.zerobounce.net/v2/validate');
    url.searchParams.set('api_key', Redacted.value(key));
    url.searchParams.set('email', email);
    // The URL carries the key: never log the request or its error.
    return yield* Effect.tryPromise(() =>
      fetch(url, { signal: AbortSignal.timeout(10_000) }).then(
        (response): Promise<unknown> => response.json(),
      ),
    ).pipe(
      Effect.flatMap(Schema.decodeUnknownEffect(Verdict)),
      Effect.map(
        (verdict) =>
          verdict.status === 'valid' ||
          (verdict.status === 'do_not_mail' &&
            verdict.sub_status === 'role_based'),
      ),
      Effect.catch(() =>
        Effect.logWarning('ZeroBounce check failed; allowed').pipe(
          Effect.as(true),
        ),
      ),
    );
  });

  return EmailCheck.of({ deliverable });
});

export const layer = Layer.effect(EmailCheck, make);
