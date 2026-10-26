import 'server-only';

import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Redacted from 'effect/Redacted';
import * as Schema from 'effect/Schema';
import { SignJWT } from 'jose';

import * as AppConfig from '@/server/app-config';

export class EarncognitoError extends Schema.TaggedError<EarncognitoError>()(
  'EarncognitoError',
  { path: Schema.String, status: Schema.optional(Schema.Finite) },
) {
  override get message() {
    return `earncognito ${this.path} failed${this.status ? ` (${this.status})` : ''}`;
  }
}

// The paths earncognito lets Earn's service token call
// (SERVICE_PATH_RESTRICTIONS in earncognito/src/utils/apiAuth/getApiAuth.ts).
// Changing one there breaks it here.
export type EarncognitoPath =
  | '/telegram/verify-listing'
  | '/telegram/verify-listing/dm-st'
  | '/telegram/unpublish-listing'
  | '/telegram/report-listing'
  | '/telegram/spam-dispute'
  | '/discord/listing-update'
  | '/discord/winners-announced';

// earncognito's protected endpoints, signed with a minute-long service
// token as `main-earn-service`.
export class Earncognito extends Context.Service<
  Earncognito,
  {
    // Posts JSON and returns the parsed answer. Not configured: the call is
    // skipped (logged) and resolves to null.
    readonly post: (
      path: EarncognitoPath,
      body: unknown,
    ) => Effect.Effect<unknown, EarncognitoError>;
  }
>()('earn/Earncognito') {}

const make = Effect.gen(function* () {
  const config = yield* AppConfig.AppConfig;
  const target = config.earncognito;

  const post = Effect.fn('Earncognito.post')(function* (
    path: EarncognitoPath,
    body: unknown,
  ) {
    if (!target) {
      yield* Effect.logWarning('earncognito not configured; call skipped').pipe(
        Effect.annotateLogs({ path }),
      );
      return null;
    }
    const token = yield* Effect.promise(() =>
      new SignJWT({ serviceName: 'main-earn-service' })
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setIssuedAt()
        .setExpirationTime('60s')
        .sign(new TextEncoder().encode(Redacted.value(target.secret))),
    );
    const response = yield* Effect.tryPromise({
      try: () =>
        fetch(`${target.url.replace(/\/+$/, '')}${path}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(15_000),
        }),
      catch: () => new EarncognitoError({ path }),
    });
    if (!response.ok) {
      return yield* new EarncognitoError({ path, status: response.status });
    }
    return yield* Effect.promise(() =>
      response.json().catch((): unknown => null),
    );
  });

  return Earncognito.of({ post });
});

export const layer = Layer.effect(Earncognito, make);
