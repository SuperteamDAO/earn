import * as Effect from 'effect/Effect';
import { NextResponse, type NextRequest } from 'next/server';

import { json, readerUser } from '@/lib/route-guard';
import * as ListingLists from '@/server/listing-lists';
import { runtime } from '@/server/runtime';

// The signed-in sponsor's newest live bounty (Earn's
// /api/listings/latest-active-slug).
export async function GET(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const writer = yield* readerUser(request);
      if (writer instanceof NextResponse) return writer;
      const result = yield* ListingLists.ListingLists.use((lists) =>
        lists.latestActiveSlug(writer.userId),
      );
      if (result.kind === 'no-sponsor') {
        return json(403, { error: 'User does not have a current sponsor.' });
      }
      if (result.kind === 'none') {
        return json(404, { error: 'No Active Bounty found' });
      }
      return json(200, result.slug);
    }).pipe(
      Effect.catchTag('DatabaseError', () =>
        Effect.succeed(json(500, { error: 'Internal server error' })),
      ),
    ),
  );
}
