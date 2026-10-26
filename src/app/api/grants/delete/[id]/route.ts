import * as Effect from 'effect/Effect';
import { NextResponse, type NextRequest } from 'next/server';

import { guardSponsor, json } from '@/lib/route-guard';
import { reviewResponse } from '@/server/grant-responses';
import * as GrantReview from '@/server/grant-review';
import { runtime } from '@/server/runtime';

// Deletes a draft grant (the dashboard's listing table).
export function POST(
  request: NextRequest,
  { params }: RouteContext<'/api/grants/delete/[id]'>,
) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const sponsor = yield* guardSponsor(request);
      if (sponsor instanceof NextResponse) return sponsor;
      const { id } = yield* Effect.promise(() => params);
      return yield* reviewResponse(
        GrantReview.GrantReview.use((review) =>
          review.deleteDraft(sponsor, id),
        ),
        () =>
          json(200, {
            message: `Draft Grant with id=${id} deleted successfully.`,
          }),
      );
    }),
  );
}
