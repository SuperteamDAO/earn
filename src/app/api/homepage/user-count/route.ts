import * as Effect from 'effect/Effect';

import { json } from '@/lib/route-guard';
import * as HomeStats from '@/server/home-stats';
import { runtime } from '@/server/runtime';

// How many people have joined Earn, rounded up to ten.
export function GET() {
  return runtime.runPromise(
    HomeStats.HomeStats.use((stats) => stats.userCount).pipe(
      Effect.map((count) =>
        Response.json(count, {
          headers: {
            'Cache-Control':
              'public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600',
          },
        }),
      ),
      Effect.catchTag('DatabaseError', () =>
        Effect.succeed(
          json(500, {
            error: 'An error occurred while fetching the total user count',
          }),
        ),
      ),
    ),
  );
}
