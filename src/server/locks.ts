import 'server-only';

import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Redacted from 'effect/Redacted';
import * as Schema from 'effect/Schema';
import { randomUUID } from 'node:crypto';

import * as AppConfig from '@/server/app-config';

export class LockBusy extends Schema.TaggedError<LockBusy>()('LockBusy', {
  key: Schema.String,
}) {
  override get message() {
    return `Lock held: ${this.key}`;
  }
}

// Earn's withRedisLock, on the same Upstash Redis and keys, so a tranche
// is never created or decided twice when Skyhook and Earn act at once.
// Without Upstash the effect runs unlocked (database row locks still hold
// within Skyhook).
export class Locks extends Context.Service<
  Locks,
  {
    readonly with: <A, E, R>(
      key: string,
      effect: Effect.Effect<A, E, R>,
    ) => Effect.Effect<A, E | LockBusy, R>;
  }
>()('earn/Locks') {}

// Earn holds them for five minutes at most.
const TTL_SECONDS = 300;

const make = Effect.gen(function* () {
  const config = yield* AppConfig.AppConfig;
  const upstash = config.upstash;

  const command = (args: ReadonlyArray<string>) =>
    upstash
      ? Effect.tryPromise(async () => {
          const response = await fetch(upstash.url, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${Redacted.value(upstash.token)}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(args),
            signal: AbortSignal.timeout(5000),
          });
          const body: unknown = await response.json();
          return typeof body === 'object' && body !== null && 'result' in body
            ? body.result
            : null;
        })
      : Effect.succeed(null);

  const withLock = <A, E, R>(key: string, effect: Effect.Effect<A, E, R>) => {
    if (!upstash) return effect;
    const token = randomUUID();
    return Effect.acquireUseRelease(
      command(['SET', key, token, 'NX', 'EX', String(TTL_SECONDS)]).pipe(
        Effect.orElseSucceed(() => null),
        Effect.flatMap((result) =>
          result === 'OK' ? Effect.void : Effect.fail(new LockBusy({ key })),
        ),
      ),
      () => effect,
      () =>
        command(['GET', key]).pipe(
          Effect.flatMap((current) =>
            current === token ? command(['DEL', key]) : Effect.void,
          ),
          Effect.ignore,
        ),
    );
  };

  return Locks.of({ with: withLock });
});

export const layer = Layer.effect(Locks, make);
