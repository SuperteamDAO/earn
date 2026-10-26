import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { NextResponse, type NextRequest } from 'next/server';

import { decodeBody, guardSponsor } from '@/lib/route-guard';
import { reviewResponse } from '@/server/grant-responses';
import * as GrantReview from '@/server/grant-review';
import { runtime } from '@/server/runtime';

const Body = Schema.Struct({
  isPublished: Schema.optional(Schema.Boolean),
  isPaused: Schema.optional(Schema.Boolean),
});

// Publishes, unpublishes, pauses or resumes a grant (the dashboard's
// listing table).
export function POST(
  request: NextRequest,
  { params }: RouteContext<'/api/grants/update/[id]'>,
) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const sponsor = yield* guardSponsor(request);
      if (sponsor instanceof NextResponse) return sponsor;
      const body = yield* decodeBody(request, Body);
      if (body instanceof NextResponse) return body;
      const { id } = yield* Effect.promise(() => params);
      return yield* reviewResponse(
        GrantReview.GrantReview.use((review) =>
          review.setFlags(sponsor, id, body),
        ),
      );
    }),
  );
}
