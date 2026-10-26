import { assert, describe, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import * as Database from '@/server/database';
import * as HomeChapters from '@/server/home-chapters';
import type { ChapterRegion } from '@/server/home-regions';
import * as LiveLists from '@/server/live-lists';

const chapter: ChapterRegion = {
  id: 'c1',
  name: 'Superteam Balkan',
  region: 'Balkan',
  displayValue: 'Balkan',
  slug: 'balkan',
  code: 'BALKAN',
  country: ['Serbia', 'Croatia'],
  banner: null,
  icons: null,
  link: null,
  hello: null,
  nationality: null,
};

const fake = () => {
  const calls: { op: string; args: { where: Record<string, unknown> } }[] = [];
  const client = {
    bounties: {
      findMany: async (args: { where: Record<string, unknown> }) => {
        calls.push({ op: 'bounties', args });
        return [];
      },
    },
    grants: {
      findMany: async (args: { where: Record<string, unknown> }) => {
        calls.push({ op: 'grants', args });
        return [
          {
            id: 'g1',
            slug: 'g',
            title: 'Grant',
            minReward: 1,
            maxReward: 10,
            token: 'USDC',
            historicalApplications: 3,
            totalPaid: 0,
            logo: null,
            isST: false,
            sponsor: {
              id: 's',
              name: 'S',
              slug: 's',
              logo: null,
              isVerified: true,
            },
            _count: { GrantApplication: 2 },
            GrantApplication: [
              { approvedAmountInUSD: 100 },
              { approvedAmountInUSD: null },
            ],
          },
        ];
      },
    },
  };
  const layer = LiveLists.layer.pipe(
    Layer.provide(
      Layer.succeed(
        Database.Database,
        Database.Database.of({
          query: (_operation, run) =>
            Effect.promise(() => run(client as never)),
        }),
      ),
    ),
    Layer.provide(
      Layer.succeed(
        HomeChapters.HomeChapters,
        HomeChapters.HomeChapters.of({ all: Effect.succeed([chapter]) }),
      ),
    ),
  );
  return { layer, calls };
};

const query: LiveLists.LiveListingsQuery = {
  take: 5,
  deadline: null,
  type: 'bounty',
  excludeIds: ['x'],
  exclusiveSponsorId: null,
};

describe('LiveLists', () => {
  it.effect('shows only Global listings to someone without a location', () => {
    const { layer, calls } = fake();
    return Effect.gen(function* () {
      const lists = yield* LiveLists.LiveLists;
      yield* lists.listings(query, null);
      assert.deepStrictEqual(calls[0]?.args.where.region, { in: ['Global'] });
      assert.deepStrictEqual(calls[0]?.args.where.id, { notIn: ['x'] });
    }).pipe(Effect.provide(layer));
  });

  it.effect("adds the viewer's chapter region and country", () => {
    const { layer, calls } = fake();
    return Effect.gen(function* () {
      const lists = yield* LiveLists.LiveLists;
      yield* lists.listings(
        { ...query, exclusiveSponsorId: 's1', type: 'hackathon' },
        'Serbia',
      );
      const where = calls[0]?.args.where ?? {};
      assert.deepStrictEqual(where.region, {
        in: ['Global', 'Balkan', 'Serbia'],
      });
      assert.strictEqual(where.sponsorId, 's1');
      assert.strictEqual(where.type, 'hackathon');
    }).pipe(Effect.provide(layer));
  });

  it.effect('lists grants in every region when signed out', () => {
    const { layer, calls } = fake();
    return Effect.gen(function* () {
      const lists = yield* LiveLists.LiveLists;
      const [grant] = yield* lists.grants({ take: 5, excludeIds: [] }, null);
      assert.isUndefined(calls[0]?.args.where.region);
      assert.strictEqual(grant?.approvedAmountTotal, 100);
      assert.strictEqual(grant?.totalApplications, 5);
      yield* lists.grants({ take: 5, excludeIds: [] }, { location: null });
      assert.deepStrictEqual(calls[1]?.args.where.region, { in: ['Global'] });
    }).pipe(Effect.provide(layer));
  });
});
