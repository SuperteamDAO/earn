import 'server-only';

import type * as Duration from 'effect/Duration';
import * as Effect from 'effect/Effect';

// Public aggregates every visitor shares, kept in memory for `ttl` (as
// Earn's Cache-Control and react-query stale times did). A failure is
// dropped at once so the next request tries again.
export const cached = <A, E>(
  effect: Effect.Effect<A, E>,
  ttl: Duration.Input,
) =>
  Effect.map(
    Effect.cachedInvalidateWithTTL(effect, ttl),
    ([value, invalidate]) => value.pipe(Effect.tapError(() => invalidate)),
  );
