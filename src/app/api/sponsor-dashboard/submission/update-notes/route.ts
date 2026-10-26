import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { NextResponse, type NextRequest } from 'next/server';

import { decodeBody, guardSponsor, json } from '@/lib/route-guard';
import * as Review from '@/server/review';
import { runtime } from '@/server/runtime';

import { refusal } from '../refusal';

const Body = Schema.Struct({
  id: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(191)),
  // The column holds 10,000 characters of the editor's HTML.
  notes: Schema.String.check(Schema.isMaxLength(10_000)),
});

// Saves a sponsor's private notes on a submission.
export function POST(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const writer = yield* guardSponsor(request);
      if (writer instanceof NextResponse) return writer;
      const body = yield* decodeBody(request, Body);
      if (body instanceof NextResponse) return body;
      return yield* Review.Review.use((review) =>
        review.updateNotes(writer, body.id, body.notes),
      ).pipe(
        Effect.map((result) => json(200, result)),
        Effect.catch((error) => Effect.succeed(refusal(error))),
      );
    }),
  );
}
