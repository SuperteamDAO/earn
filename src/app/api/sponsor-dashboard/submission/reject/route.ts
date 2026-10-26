import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { NextResponse, type NextRequest } from 'next/server';

import { decodeBody, guardSponsor, json } from '@/lib/route-guard';
import * as Review from '@/server/review';
import { runtime } from '@/server/runtime';

import { refusal } from '../refusal';

const Id = Schema.String.check(Schema.isMaxLength(191));

const Body = Schema.Struct({
  data: Schema.Array(Schema.Struct({ id: Id })).check(Schema.isMaxLength(500)),
});

// Rejects submissions, emailing each entrant.
export function POST(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const writer = yield* guardSponsor(request);
      if (writer instanceof NextResponse) return writer;
      const body = yield* decodeBody(request, Body);
      if (body instanceof NextResponse) return body;
      return yield* Review.Review.use((review) =>
        review.reject(
          writer,
          body.data.map((item) => item.id),
        ),
      ).pipe(
        Effect.map((result) => json(200, result)),
        Effect.catch((error) => Effect.succeed(refusal(error))),
      );
    }),
  );
}
