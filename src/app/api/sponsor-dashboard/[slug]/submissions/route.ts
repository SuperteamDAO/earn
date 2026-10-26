import * as Effect from 'effect/Effect';
import { NextResponse, type NextRequest } from 'next/server';

import { json, readerSponsor } from '@/lib/route-guard';
import * as Review from '@/server/review';
import { runtime } from '@/server/runtime';

// A listing's submissions for its sponsor (or its hackathon's), in review
// order, each with what the entrant has earned on Earn.
export function GET(
  request: NextRequest,
  { params }: RouteContext<'/api/sponsor-dashboard/[slug]/submissions'>,
) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const writer = yield* readerSponsor(request);
      if (writer instanceof NextResponse) return writer;
      const { slug } = yield* Effect.promise(() => params);
      const hackathon =
        request.nextUrl.searchParams.get('isHackathon') === 'true';
      return yield* Review.Review.use((review) =>
        review.submissions(writer, slug, hackathon),
      ).pipe(
        Effect.map((submissions) => json(200, submissions)),
        Effect.catchTag('DatabaseError', () =>
          Effect.succeed(json(500, { error: 'Internal Server Error' })),
        ),
      );
    }),
  );
}
