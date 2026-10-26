import 'server-only';

import { waitUntil } from '@vercel/functions';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

// Work that finishes after the response, as Earn's `waitUntil`: the
// function stays alive for it on Vercel. The effect must handle its own
// failures.
export class ReviewBackground extends Context.Service<
  ReviewBackground,
  { readonly run: (effect: Effect.Effect<void>) => Effect.Effect<void> }
>()('earn/ReviewBackground') {}

export const layer = Layer.succeed(
  ReviewBackground,
  ReviewBackground.of({
    run: (effect) => Effect.sync(() => waitUntil(Effect.runPromise(effect))),
  }),
);
