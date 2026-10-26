import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';
import type { NextRequest } from 'next/server';

import { json } from '@/lib/route-guard';
import * as HomeStats from '@/server/home-stats';
import { runtime } from '@/server/runtime';

const decodeFilter = Schema.decodeUnknownOption(
  Schema.Literals(HomeStats.CATEGORY_FILTERS),
);

// What winners in a category (design, content, development) have earned.
export function GET(request: NextRequest) {
  const filter = decodeFilter(request.nextUrl.searchParams.get('filter'));
  if (Option.isNone(filter)) return json(400, { error: 'Invalid request' });
  return runtime.runPromise(
    HomeStats.HomeStats.use((stats) =>
      stats.categoryEarnings(filter.value),
    ).pipe(
      Effect.map((earnings) =>
        Response.json(earnings, {
          headers: {
            'Cache-Control':
              'public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600',
          },
        }),
      ),
      Effect.catchTag('DatabaseError', () =>
        Effect.succeed(json(400, { error: 'Invalid request' })),
      ),
    ),
  );
}
