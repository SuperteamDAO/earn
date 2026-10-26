import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import { NextResponse, type NextRequest } from 'next/server';

import { json, sessionOf } from '@/lib/route-guard';
import * as GrantLists from '@/server/grant-lists';
import * as ListingLists from '@/server/listing-lists';
import { runtime } from '@/server/runtime';

// A list's grants (Earn's /api/grants). The viewer comes from the session,
// no longer from a client-set cookie.
export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const query = GrantLists.decodeGrantListQuery(params);
  if (Option.isNone(query)) return json(400, { errors: 'Invalid query' });
  return runtime.runPromise(
    Effect.gen(function* () {
      const privyDid = yield* sessionOf(request);
      const viewer = Option.isSome(privyDid)
        ? yield* ListingLists.ListingLists.use((lists) =>
            lists.viewer(privyDid.value),
          ).pipe(Effect.catchTag('ViewerBlocked', () => Effect.succeed(null)))
        : null;
      const grants = yield* GrantLists.GrantLists.use((lists) =>
        lists.list(query.value, viewer),
      );
      return NextResponse.json(grants, {
        headers: {
          'Cache-Control': viewer
            ? 'private, max-age=300, stale-while-revalidate=600'
            : 'public, max-age=300, stale-while-revalidate=600',
          Vary: 'Cookie',
        },
      });
    }).pipe(
      Effect.catchTag('DatabaseError', () =>
        Effect.succeed(json(500, { message: 'Database error' })),
      ),
    ),
  );
}
