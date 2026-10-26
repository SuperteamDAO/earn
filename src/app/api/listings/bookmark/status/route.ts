import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import type { NextRequest } from 'next/server';

import { json, sessionOf } from '@/lib/route-guard';
import * as ListingBookmarks from '@/server/listing-bookmarks';
import { runtime } from '@/server/runtime';

// Who has bookmarked a listing; only the viewer's own id is shown.
export function GET(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const listingId = request.nextUrl.searchParams.get('listingId');
      if (!listingId) return json(400, { message: 'Invalid listingId' });
      const privyDid = Option.getOrNull(yield* sessionOf(request));
      return yield* ListingBookmarks.ListingBookmarks.use((bookmarks) =>
        bookmarks.statusList(listingId, privyDid),
      ).pipe(
        Effect.map((list) => json(200, list)),
        Effect.catchTags({
          BookmarksBlocked: () =>
            Effect.succeed(json(403, { error: 'User is blocked' })),
          DatabaseError: () =>
            Effect.succeed(
              json(500, {
                error: 'Internal Server Error',
                message: 'Error occurred while fetching bookmark status.',
              }),
            ),
        }),
      );
    }),
  );
}
