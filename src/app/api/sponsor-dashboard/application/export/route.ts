import * as Effect from 'effect/Effect';
import { NextResponse, type NextRequest } from 'next/server';

import { readerSponsor } from '@/lib/route-guard';
import { reviewResponse } from '@/server/grant-responses';
import * as GrantReview from '@/server/grant-review';
import { runtime } from '@/server/runtime';

// The grant's applications as a CSV download, Earn's columns.
export function GET(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const sponsor = yield* readerSponsor(request);
      if (sponsor instanceof NextResponse) return sponsor;
      const grantId = request.nextUrl.searchParams.get('grantId') ?? '';
      return yield* reviewResponse(
        GrantReview.GrantReview.use((review) =>
          review.exportCsv(sponsor, grantId),
        ),
        ({ name, csv }) =>
          new NextResponse(csv, {
            headers: {
              'content-type': 'text/csv; charset=utf-8',
              'content-disposition': `attachment; filename="${name.replace(/[^\w.-]/g, '_')}"`,
              'cache-control': 'no-store',
            },
          }),
      );
    }),
  );
}
