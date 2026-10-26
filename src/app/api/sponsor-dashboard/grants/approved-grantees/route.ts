import * as Effect from 'effect/Effect';
import { NextResponse, type NextRequest } from 'next/server';

import { readerSponsor } from '@/lib/route-guard';
import { reviewResponse } from '@/server/grant-responses';
import * as GrantReview from '@/server/grant-review';
import { runtime } from '@/server/runtime';

// The grant's approved grantees, searched as the sponsor types (the
// payments history tab).
export function GET(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const sponsor = yield* readerSponsor(request);
      if (sponsor instanceof NextResponse) return sponsor;
      const params = request.nextUrl.searchParams;
      return yield* reviewResponse(
        GrantReview.GrantReview.use((review) =>
          review.approvedGrantees(
            sponsor,
            params.get('grantId') ?? '',
            params.get('search') ?? '',
          ),
        ),
      );
    }),
  );
}
