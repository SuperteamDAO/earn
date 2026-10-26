import 'server-only';

import * as Effect from 'effect/Effect';

import * as HomeStats from '@/server/home-stats';
import { runtime } from '@/server/runtime';

// The welcome carousel's counts (users, sponsors), rounded as Earn shows
// them; missing when they can't be loaded.
export const homeCounts = () =>
  runtime.runPromise(
    HomeStats.HomeStats.use((stats) =>
      Effect.all(
        [
          stats.userCount.pipe(Effect.map((count) => count.totalUsers)),
          stats.sponsorCount.pipe(Effect.map((count) => count.totalSponsors)),
        ],
        { concurrency: 'unbounded' },
      ),
    ).pipe(
      Effect.map(([totalUsers, totalSponsors]) => ({
        totalUsers,
        totalSponsors,
      })),
      Effect.orElseSucceed(() => null),
    ),
  );
