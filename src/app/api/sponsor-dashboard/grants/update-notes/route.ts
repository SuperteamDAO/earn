import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { NextResponse, type NextRequest } from 'next/server';

import { decodeBody, guardSponsor, json } from '@/lib/route-guard';
import { reviewResponse } from '@/server/grant-responses';
import * as GrantReview from '@/server/grant-review';
import { runtime } from '@/server/runtime';

const Body = Schema.Struct({
  id: Schema.optional(Schema.String),
  notes: Schema.optional(Schema.Unknown),
});

// Saves the sponsor's private notes on an application.
export function POST(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const sponsor = yield* guardSponsor(request);
      if (sponsor instanceof NextResponse) return sponsor;
      const body = yield* decodeBody(request, Body);
      if (body instanceof NextResponse) return body;
      if (!body.id || body.notes === undefined) {
        return json(400, { error: 'id and notes are required' });
      }
      if (typeof body.notes !== 'string') {
        return json(400, {
          error: 'notes must be a string of 2000 characters or fewer',
        });
      }
      const { id, notes } = body;
      return yield* reviewResponse(
        GrantReview.GrantReview.use((review) =>
          review.notes(sponsor, id, notes),
        ),
      );
    }),
  );
}
