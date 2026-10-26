import * as Effect from 'effect/Effect';
import type { NextRequest } from 'next/server';

import { json } from '@/lib/route-guard';
import * as ListingDetails from '@/server/listing-details';
import { runtime } from '@/server/runtime';

// How many live submissions a listing has.
export function GET(
  _request: NextRequest,
  { params }: RouteContext<'/api/listings/[listingId]/submission-count'>,
) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const { listingId } = yield* Effect.promise(() => params);
      return yield* ListingDetails.ListingDetails.use((details) =>
        details.submissionCount(listingId),
      ).pipe(
        Effect.map((count) => json(200, count)),
        Effect.catchTag('DatabaseError', () =>
          Effect.succeed(
            json(400, {
              error: 'Internal Server Error',
              message: `Error occurred while fetching submission count of listing=${listingId}.`,
            }),
          ),
        ),
      );
    }),
  );
}
