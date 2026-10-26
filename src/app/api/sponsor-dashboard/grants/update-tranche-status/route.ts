import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { NextResponse, type NextRequest } from 'next/server';

import { decodeBody, guardSponsor, json } from '@/lib/route-guard';
import { reviewResponse } from '@/server/grant-responses';
import * as GrantReview from '@/server/grant-review';
import { runtime } from '@/server/runtime';

const Body = Schema.Struct({
  id: Schema.String,
  approvedAmount: Schema.optional(
    Schema.Finite.check(Schema.makeFilter((n) => Number.isFinite(n) && n > 0)),
  ),
  status: Schema.Literals(['Approved', 'Rejected']),
  customNote: Schema.optional(Schema.String),
});

// Approves or rejects a tranche the grantee asked for.
export function POST(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const sponsor = yield* guardSponsor(request);
      if (sponsor instanceof NextResponse) return sponsor;
      const body = yield* decodeBody(request, Body);
      if (body instanceof NextResponse) return body;
      const customNote = body.customNote?.trim();
      if (
        (customNote !== undefined &&
          (customNote.length < 1 || customNote.length > 5000)) ||
        (body.status === 'Approved' && body.approvedAmount === undefined)
      ) {
        return json(400, { error: 'Invalid request body' });
      }
      return yield* reviewResponse(
        GrantReview.GrantReview.use((review) =>
          review.decideTranche(sponsor, { ...body, customNote }),
        ),
        () => json(200, { status: 200 }),
      );
    }),
  );
}
