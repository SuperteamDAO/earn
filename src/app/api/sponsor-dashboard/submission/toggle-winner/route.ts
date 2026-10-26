import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { NextResponse, type NextRequest } from 'next/server';

import { decodeBody, guardSponsor, json } from '@/lib/route-guard';
import * as Review from '@/server/review';
import { runtime } from '@/server/runtime';

import { refusal } from '../refusal';

const Body = Schema.Struct({
  submissions: Schema.Array(
    Schema.Struct({
      id: Schema.String.check(Schema.isMaxLength(191)),
      isWinner: Schema.optional(Schema.Boolean),
      winnerPosition: Schema.optional(Schema.NullOr(Schema.Int)),
    }),
  ).check(Schema.isMaxLength(500)),
});

// Picks or unpicks winners, up to 50 at once.
export function POST(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const writer = yield* guardSponsor(request);
      if (writer instanceof NextResponse) return writer;
      const body = yield* decodeBody(request, Body);
      if (body instanceof NextResponse) return body;
      return yield* Review.Review.use((review) =>
        review.toggleWinners(writer, body.submissions),
      ).pipe(
        Effect.map((result) => json(200, result)),
        Effect.catch((error) => Effect.succeed(refusal(error))),
      );
    }),
  );
}
