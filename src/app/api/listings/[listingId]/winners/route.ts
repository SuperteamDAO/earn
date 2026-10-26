import * as Effect from 'effect/Effect';
import type { NextRequest } from 'next/server';

import { json } from '@/lib/route-guard';
import * as ListingDetails from '@/server/listing-details';
import { runtime } from '@/server/runtime';

// A listing's announced winners, by position.
export function GET(
  _request: NextRequest,
  { params }: RouteContext<'/api/listings/[listingId]/winners'>,
) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const { listingId } = yield* Effect.promise(() => params);
      return yield* ListingDetails.ListingDetails.use((details) =>
        details.winners(listingId),
      ).pipe(
        Effect.map((winners) => json(200, winners)),
        Effect.catchTag('DatabaseError', () =>
          Effect.succeed(
            json(400, {
              error: 'Internal Server Error',
              message: `Error occurred while fetching winning submissions for listing ID=${listingId}.`,
            }),
          ),
        ),
      );
    }),
  );
}
