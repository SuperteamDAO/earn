import * as Effect from 'effect/Effect';

import { json } from '@/lib/route-guard';
import * as HomeStats from '@/server/home-stats';
import { runtime } from '@/server/runtime';

// What the open listings are worth, in USD.
export function GET() {
  return runtime.runPromise(
    HomeStats.HomeStats.use((stats) => stats.liveOpportunities).pipe(
      Effect.map((worth) =>
        Response.json(worth, {
          headers: {
            'Cache-Control':
              'public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600',
          },
        }),
      ),
      Effect.catchTag('DatabaseError', () =>
        Effect.succeed(
          json(500, { error: 'Failed to fetch live opportunities' }),
        ),
      ),
    ),
  );
}
