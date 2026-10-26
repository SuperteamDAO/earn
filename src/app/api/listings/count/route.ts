import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import { NextResponse, type NextRequest } from 'next/server';

import { json, sessionOf } from '@/lib/route-guard';
import * as ListingLists from '@/server/listing-lists';
import { runtime } from '@/server/runtime';

// How many listings each category pill would show (Earn's
// /api/listings/count).
export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const query = ListingLists.decodeListQuery({ ...params, category: 'All' });
  if (Option.isNone(query)) return json(400, { errors: 'Invalid query' });
  return runtime.runPromise(
    Effect.gen(function* () {
      const lists = yield* ListingLists.ListingLists;
      const privyDid = yield* sessionOf(request);
      const viewer = Option.isSome(privyDid)
        ? yield* lists.viewer(privyDid.value)
        : null;
      const counts = yield* lists.counts(query.value, viewer);
      return NextResponse.json(counts, {
        headers: {
          'Cache-Control': 'private, max-age=300, stale-while-revalidate=600',
          Vary: 'Cookie',
        },
      });
    }).pipe(
      Effect.catchTags({
        ViewerBlocked: () =>
          Effect.succeed(json(403, { error: 'User is blocked' })),
        DatabaseError: () =>
          Effect.succeed(json(500, { message: 'Database error' })),
      }),
    ),
  );
}
