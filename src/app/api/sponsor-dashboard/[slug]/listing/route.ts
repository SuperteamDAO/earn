import * as Effect from 'effect/Effect';
import { NextResponse, type NextRequest } from 'next/server';

import { json, readerSponsor } from '@/lib/route-guard';
import * as Review from '@/server/review';
import { runtime } from '@/server/runtime';

// A listing as its sponsor's dashboard reads it, with how many winners are
// paid. Another sponsor's listing is refused, naming that sponsor when the
// account may switch to it.
export function GET(
  request: NextRequest,
  { params }: RouteContext<'/api/sponsor-dashboard/[slug]/listing'>,
) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const writer = yield* readerSponsor(request);
      if (writer instanceof NextResponse) return writer;
      const { slug } = yield* Effect.promise(() => params);
      return yield* Review.Review.use((review) =>
        review.listing(writer, slug),
      ).pipe(
        Effect.map((listing) => json(200, listing)),
        Effect.catchTags({
          NotYourListing: (error) =>
            Effect.succeed(
              json(403, {
                message: `Listing with slug=${slug} does not belong to user ${writer.userId}`,
                ...(error.sponsorId ? { sponsorId: error.sponsorId } : {}),
              }),
            ),
          DatabaseError: () =>
            Effect.succeed(json(400, { error: 'Internal Server Error' })),
        }),
      );
    }),
  );
}
