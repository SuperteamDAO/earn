import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import type { NextRequest } from 'next/server';

import { json, sessionOf } from '@/lib/route-guard';
import * as ListingSearch from '@/server/listing-search';
import { runtime } from '@/server/runtime';

// Search (the header's typeahead, the search page's "View More"): listings
// and grants matching the query, in the searcher's regions.
export async function GET(
  request: NextRequest,
  { params }: RouteContext<'/api/search/[query]'>,
) {
  const { query } = await params;
  const parsed = ListingSearch.parseSearchParams(
    query,
    request.nextUrl.searchParams,
  );
  if (parsed instanceof ListingSearch.InvalidSearch) {
    return json(400, { error: parsed.reason });
  }
  return runtime.runPromise(
    Effect.gen(function* () {
      const privyDid = yield* sessionOf(request);
      const page = yield* ListingSearch.ListingSearch.use((search) =>
        search.search(parsed, Option.getOrNull(privyDid)),
      );
      return json(200, page);
    }).pipe(
      Effect.catchTags({
        SearchBlocked: () =>
          Effect.succeed(json(403, { error: 'User is blocked' })),
        DatabaseError: () =>
          Effect.succeed(json(500, { error: 'Internal Server Error' })),
      }),
    ),
  );
}
