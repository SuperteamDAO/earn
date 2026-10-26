import { assert, describe, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Layer from 'effect/Layer';

import * as Database from '@/server/database';
import * as HomeStats from '@/server/home-stats';

const fake = (overrides: Record<string, unknown> = {}) => {
  let queries = 0;
  const client = {
    user: { count: async () => 12_345 },
    sponsors: {
      count: async () => 101,
      findUnique: async ({ where }: { where: { id: string } }) =>
        where.id === 's1' ? { createdAt: new Date('2023-04-01') } : null,
    },
    bounties: {
      count: async () => 2,
      aggregate: async () => ({ _sum: { usdValue: 1000.4 } }),
      findMany: async () => [
        { id: 'a', isWinnersAnnounced: true, _count: { Submission: 5 } },
        { id: 'b', isWinnersAnnounced: false, _count: { Submission: 3 } },
        // Too few submissions to count.
        { id: 'c', isWinnersAnnounced: false, _count: { Submission: 1 } },
      ],
    },
    grants: { count: async () => 1 },
    grantApplication: {
      aggregate: async () => ({ _sum: { approvedAmountInUSD: 250 } }),
      count: async () => 4,
    },
    submission: {
      count: async () => 20,
      findMany: async () => [
        {
          winnerPosition: 2,
          user: {
            id: 'u1',
            username: 'ada',
            photo: null,
            firstName: 'Ada',
            lastName: 'L',
          },
          listing: {
            slug: 'l',
            title: 'Listing',
            rewards: { '1': 500, '2': 300 },
            token: 'USDC',
            winnersAnnouncedAt: null,
          },
        },
      ],
    },
    $queryRaw: async () => [
      { participations: 7n, wins: 2n, totalWinnings: 640 },
    ],
    ...overrides,
  };
  const layer = HomeStats.layer.pipe(
    Layer.provide(
      Layer.succeed(
        Database.Database,
        Database.Database.of({
          query: (_operation, run) =>
            Effect.suspend(() => {
              queries += 1;
              return Effect.promise(() => run(client as never));
            }),
        }),
      ),
    ),
  );
  return { layer, queries: () => queries };
};

describe('HomeStats', () => {
  it.effect('rounds the public counts up as Earn does', () => {
    const { layer } = fake();
    return Effect.gen(function* () {
      const stats = yield* HomeStats.HomeStats;
      assert.deepStrictEqual(yield* stats.userCount, { totalUsers: 12_060 });
      assert.deepStrictEqual(yield* stats.sponsorCount, {
        totalSponsors: 110,
      });
      assert.deepStrictEqual(yield* stats.totals, {
        totalInUSD: 1260,
        count: 2,
      });
    }).pipe(Effect.provide(layer));
  });

  it.effect('keeps public aggregates in memory', () => {
    const { layer, queries } = fake();
    return Effect.gen(function* () {
      const stats = yield* HomeStats.HomeStats;
      yield* stats.userCount;
      yield* stats.userCount;
      yield* stats.liveOpportunities;
      yield* stats.liveOpportunities;
      assert.strictEqual(queries(), 2);
    }).pipe(Effect.provide(layer));
  });

  it.effect("pays each earner their place's reward", () => {
    const { layer } = fake();
    return Effect.gen(function* () {
      const stats = yield* HomeStats.HomeStats;
      const [earner] = yield* stats.recentEarners;
      assert.strictEqual(earner?.reward, 300);
      assert.strictEqual(earner?.rewardToken, 'USDC');
    }).pipe(Effect.provide(layer));
  });

  it.effect('turns the raw stats into numbers', () => {
    const { layer } = fake();
    return Effect.gen(function* () {
      const stats = yield* HomeStats.HomeStats;
      assert.deepStrictEqual(yield* stats.userStats('u1'), {
        participations: 7,
        wins: 2,
        totalWinnings: 640,
      });
    }).pipe(Effect.provide(layer));
  });

  it.effect('fails for a user with no row', () => {
    const { layer } = fake({ $queryRaw: async () => [] });
    return Effect.gen(function* () {
      const stats = yield* HomeStats.HomeStats;
      const exit = yield* Effect.exit(stats.userStats('nobody'));
      assert.isTrue(Exit.isFailure(exit));
    }).pipe(Effect.provide(layer));
  });

  it.effect('rates completion over bounties with three submissions', () => {
    const { layer } = fake();
    return Effect.gen(function* () {
      const stats = yield* HomeStats.HomeStats;
      const sponsor = yield* stats.sponsorStats('s1');
      assert.strictEqual(sponsor.completionRate, 50);
      assert.strictEqual(sponsor.totalRewardAmount, 1250.4);
      assert.strictEqual(sponsor.totalListingsAndGrants, 3);
      assert.strictEqual(sponsor.totalSubmissionsAndApplications, 24);
      assert.strictEqual(sponsor.yearOnPlatform, 2023);
      const missing = yield* Effect.exit(stats.sponsorStats('nope'));
      assert.isTrue(Exit.isFailure(missing));
    }).pipe(Effect.provide(layer));
  });

  it('filters category earnings by skill group', () => {
    assert.deepStrictEqual(HomeStats.skillsFilter('design'), {
      skills: { path: '$[*].skills', array_contains: ['Design'] },
    });
    assert.strictEqual(HomeStats.skillsFilter('development').OR?.length, 4);
  });
});
