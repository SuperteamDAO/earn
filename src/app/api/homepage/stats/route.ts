import * as Effect from 'effect/Effect';

import { json } from '@/lib/route-guard';
import * as HomeStats from '@/server/home-stats';
import { runtime } from '@/server/runtime';

// What Earn has paid out and how many listings it has published.
export function GET() {
  return runtime.runPromise(
    HomeStats.HomeStats.use((stats) => stats.totals).pipe(
      Effect.map((totals) =>
        Response.json(totals, {
          headers: {
            'Cache-Control':
              'public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600',
          },
        }),
      ),
      Effect.catchTag('DatabaseError', () =>
        Effect.succeed(
          json(500, {
            error: 'An error occurred while fetching the total reward amount',
          }),
        ),
      ),
    ),
  );
}
