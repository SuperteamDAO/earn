import * as Effect from 'effect/Effect';

import { json } from '@/lib/route-guard';
import * as HomeStats from '@/server/home-stats';
import { runtime } from '@/server/runtime';

// The five latest submissions, for the sidebar's recent activity.
export function GET() {
  return runtime.runPromise(
    HomeStats.HomeStats.use((stats) => stats.recentActivity).pipe(
      Effect.map((activity) =>
        Response.json(activity, {
          headers: {
            'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
          },
        }),
      ),
      Effect.catchTag('DatabaseError', () =>
        Effect.succeed(
          json(500, { error: 'Error occurred while fetching feed data.' }),
        ),
      ),
    ),
  );
}
