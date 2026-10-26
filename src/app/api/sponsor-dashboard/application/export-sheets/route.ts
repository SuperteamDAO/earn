import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { NextResponse, type NextRequest } from 'next/server';

import { decodeBody, guardSponsor, json } from '@/lib/route-guard';
import { reviewResponse } from '@/server/grant-responses';
import * as GrantReview from '@/server/grant-review';
import { runtime } from '@/server/runtime';

const Body = Schema.Struct({ grantId: Schema.optional(Schema.String) });

// Writes the grant's applications to a new Google Sheet anyone with the
// link can read. A POST: it makes something.
export function POST(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const sponsor = yield* guardSponsor(request);
      if (sponsor instanceof NextResponse) return sponsor;
      const body = yield* decodeBody(request, Body);
      if (body instanceof NextResponse) return body;
      return yield* reviewResponse(
        GrantReview.GrantReview.use((review) =>
          review.exportSheet(sponsor, body.grantId ?? ''),
        ),
        (url) => json(200, { url }),
      );
    }),
  );
}
