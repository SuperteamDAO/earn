import 'server-only';

import * as Cache from 'effect/Cache';
import * as Context from 'effect/Context';
import * as Duration from 'effect/Duration';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Layer from 'effect/Layer';

import * as Database from '@/server/database';

export interface LandingStats {
  // People on Earn, to the ten.
  readonly totalUsers: number;
  // Paid out in bounties and grants, in USD, to the ten.
  readonly totalInUSD: number;
}

// Accounts Earn counts as errors, left out of its user count.
const ERROR_ACCOUNTS = 289;

const roundUpToTen = (value: number) => Math.ceil(value / 10) * 10;

// The /earn/sponsor landing's numbers, worked out as Earn's
// /api/homepage/user-count and /api/homepage/stats do.
export class SponsorLanding extends Context.Service<
  SponsorLanding,
  {
    readonly stats: Effect.Effect<LandingStats, Database.DatabaseError>;
  }
>()('earn/SponsorLanding') {}

const make = Effect.gen(function* () {
  const database = yield* Database.Database;

  const fetchStats = () =>
    Effect.all(
      [
        database.query('landingUserCount', (client) => client.user.count()),
        database.query('landingListingRewards', (client) =>
          client.bounties.aggregate({
            _sum: { usdValue: true },
            where: {
              isWinnersAnnounced: true,
              isPublished: true,
              status: 'OPEN',
            },
          }),
        ),
        database.query('landingGrantRewards', (client) =>
          client.grantApplication.aggregate({
            _sum: { approvedAmountInUSD: true },
            where: {
              OR: [
                { applicationStatus: 'Approved' },
                { applicationStatus: 'Completed' },
              ],
            },
          }),
        ),
      ],
      { concurrency: 'unbounded' },
    ).pipe(
      Effect.map(([users, listings, grants]): LandingStats => ({
        totalUsers: roundUpToTen(users - ERROR_ACCOUNTS),
        totalInUSD: roundUpToTen(
          (listings._sum.usdValue ?? 0) +
            (grants._sum.approvedAmountInUSD ?? 0),
        ),
      })),
    );

  // Earn let these be cached for a day; an hour on this server is plenty.
  // Failures aren't kept, so the next visit tries again.
  const cache = yield* Cache.makeWith(fetchStats, {
    capacity: 1,
    timeToLive: (exit) => (Exit.isSuccess(exit) ? Duration.hours(1) : 0),
  });

  return SponsorLanding.of({ stats: Cache.get(cache, undefined) });
});

export const layer = Layer.effect(SponsorLanding, make);
