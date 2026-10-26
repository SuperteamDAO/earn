import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { NextResponse, type NextRequest } from 'next/server';

import { decodeBody, guardSponsor, json } from '@/lib/route-guard';
import { reviewResponse } from '@/server/grant-responses';
import * as GrantReview from '@/server/grant-review';
import { runtime } from '@/server/runtime';

const MAX_RECORDS = 10;

const Body = Schema.Struct({
  data: Schema.Array(
    Schema.Struct({
      id: Schema.String,
      approvedAmount: Schema.optional(
        Schema.NullOr(
          Schema.Finite.check(
            Schema.makeFilter((n) => Number.isInteger(n) && n >= 0),
          ),
        ),
      ),
    }),
  ).check(Schema.isMinLength(1), Schema.isMaxLength(MAX_RECORDS)),
  applicationStatus: Schema.String,
  customNote: Schema.optional(Schema.String),
  skipCooldown: Schema.optional(Schema.Boolean),
});

// Approves or rejects up to ten applications of one grant.
export function POST(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const sponsor = yield* guardSponsor(request);
      if (sponsor instanceof NextResponse) return sponsor;
      const body = yield* decodeBody(request, Body);
      if (body instanceof NextResponse) return body;
      // Earn trims the note and wants 1 to 5000 characters of it.
      const customNote = body.customNote?.trim();
      if (
        customNote !== undefined &&
        (customNote.length < 1 || customNote.length > 5000)
      ) {
        return json(400, { error: 'Invalid request body' });
      }
      return yield* reviewResponse(
        GrantReview.GrantReview.use((review) =>
          review.decide(sponsor, { ...body, customNote }),
        ),
      );
    }),
  );
}
