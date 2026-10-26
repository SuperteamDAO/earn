import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { NextResponse, type NextRequest } from 'next/server';

import { decodeBody, guardSponsor } from '@/lib/route-guard';
import { reviewResponse } from '@/server/grant-responses';
import * as GrantReview from '@/server/grant-review';
import { runtime } from '@/server/runtime';

const Body = Schema.Struct({
  id: Schema.optional(Schema.String),
  ids: Schema.optional(Schema.Array(Schema.String)),
  label: Schema.optional(Schema.String),
});

// Labels one application, or several as Spam or Shortlisted.
export function POST(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const sponsor = yield* guardSponsor(request);
      if (sponsor instanceof NextResponse) return sponsor;
      const body = yield* decodeBody(request, Body);
      if (body instanceof NextResponse) return body;
      const ids = body.ids ?? (body.id ? [body.id] : []);
      return yield* reviewResponse(
        GrantReview.GrantReview.use((review) =>
          review.label(sponsor, { ids, label: body.label ?? '' }),
        ),
      );
    }),
  );
}
