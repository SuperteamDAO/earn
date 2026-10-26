import * as Effect from 'effect/Effect';

import { json } from '@/lib/route-guard';
import * as HomeStats from '@/server/home-stats';
import { runtime } from '@/server/runtime';

// The latest winners of $200 or more, for the sidebar.
export function GET() {
  return runtime.runPromise(
    HomeStats.HomeStats.use((stats) => stats.recentEarners).pipe(
      Effect.map((earners) =>
        Response.json(earners, {
          headers: {
            'Cache-Control':
              'public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600',
          },
        }),
      ),
      Effect.catchTag('DatabaseError', () =>
        Effect.succeed(
          json(400, {
            error: 'Internal Server Error',
            message: 'Error occurred while fetching totals',
          }),
        ),
      ),
    ),
  );
}
