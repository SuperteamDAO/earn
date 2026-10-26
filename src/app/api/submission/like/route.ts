import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { NextResponse, type NextRequest } from 'next/server';

import { decodeBody, guardUser, json } from '@/lib/route-guard';
import * as ListingLikes from '@/server/listing-likes';
import { runtime } from '@/server/runtime';

const Body = Schema.Struct({ id: Schema.NonEmptyString });

// Likes a submission on a listing's submissions tab, or takes it back.
export function POST(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const writer = yield* guardUser(request);
      if (writer instanceof NextResponse) return writer;
      const body = yield* decodeBody(request, Body, 1024);
      if (body instanceof NextResponse) {
        return body.status === 400
          ? json(400, { message: 'Submission ID is required.' })
          : body;
      }
      return yield* ListingLikes.ListingLikes.use((likes) =>
        likes.toggleSubmission(writer.userId, body.id),
      ).pipe(
        Effect.as(
          json(200, { data: { ok: true }, message: 'Operation successful' }),
        ),
        Effect.catchTag('DatabaseError', () =>
          Effect.succeed(
            json(500, {
              error: 'Internal Server Error',
              message: 'Error occurred while updating submission like.',
            }),
          ),
        ),
      );
    }),
  );
}
