import { assert, describe, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Layer from 'effect/Layer';

import * as Database from '@/server/database';
import * as HomeChapters from '@/server/home-chapters';
import * as ListingSearch from '@/server/listing-search';

interface Call {
  readonly sql: string;
  readonly values: ReadonlyArray<unknown>;
}

const bountyRow = {
  id: 'b1',
  slug: 'design-a-logo',
  title: 'Design a logo',
  type: 'bounty',
  token: 'USDC',
  rewardAmount: 500,
  deadline: new Date('2026-11-01'),
  winnersAnnouncedAt: null,
  isWinnersAnnounced: 0,
  isFeatured: 1,
  compensationType: 'fixed',
  minRewardAsk: null,
  maxRewardAsk: null,
  // The driver may hand JSON_OBJECT columns over as text.
  sponsor: '{"name":"Halcyon","logo":null,"isVerified":1,"slug":"halcyon"}',
  _count: { Comments: 3 },
};

const grantRow = {
  id: 'g1',
  slug: 'build-grant',
  title: 'Build grant',
  minReward: 1000,
  maxReward: 5000,
  token: 'USDC',
  historicalApplications: 4,
  sponsor: { name: 'Halcyon', logo: 'l.png', isVerified: 0, slug: 'halcyon' },
  approvedAmountTotal: '9000',
  approvedApplications: BigInt(2),
};

const fake = (
  user: { location: string | null; isBlocked: boolean } | null = null,
) => {
  const calls: Call[] = [];
  const client = {
    $queryRawUnsafe: async (sql: string, ...values: unknown[]) => {
      calls.push({ sql, values });
      if (sql.includes('FROM Hackathon')) return [];
      if (sql.includes('COUNT(*) as totalCount')) {
        return [{ totalCount: sql.includes('FROM Grants') ? 1n : 7n }];
      }
      if (sql.includes('FROM Grants')) return [grantRow];
      return [bountyRow];
    },
    user: { findFirst: async () => user },
    chapter: {
      findMany: async () => [
        {
          id: 'c1',
          name: 'Superteam India',
          region: 'India',
          displayValue: 'India',
          slug: 'india',
          code: 'IN',
          countries: ['India'],
          banner: null,
          icons: null,
          link: null,
          hello: null,
          nationality: null,
        },
      ],
    },
  };
  const database = Layer.succeed(
    Database.Database,
    Database.Database.of({
      query: (_operation, run) => Effect.promise(() => run(client as never)),
    }),
  );
  const layer = ListingSearch.layer.pipe(
    Layer.provide(HomeChapters.layer),
    Layer.provide(database),
  );
  return { calls, layer };
};

const params = (query: string, search = '') => {
  const parsed = ListingSearch.parseSearchParams(
    query,
    new URLSearchParams(search),
  );
  if (parsed instanceof ListingSearch.InvalidSearch) throw parsed;
  return parsed;
};

describe('parseSearchParams', () => {
  it('takes Earn defaults and clamps limits', () => {
    const parsed = params('dev', 'bountiesLimit=99');
    assert.strictEqual(parsed.bountiesLimit, 25);
    assert.strictEqual(parsed.grantsLimit, 2);
    assert.strictEqual(parsed.bountiesOffset, 0);
  });

  it('refuses unknown statuses, skills and bad numbers', () => {
    for (const search of [
      'status=OPEN,NOPE',
      'skills=MUSIC',
      'grantsOffset=-1',
    ]) {
      assert.instanceOf(
        ListingSearch.parseSearchParams('x', new URLSearchParams(search)),
        ListingSearch.InvalidSearch,
      );
    }
  });

  it('blanks characters outside the allowed set', () => {
    assert.strictEqual(params("a'b;c").query, 'a b c');
  });
});

describe('ListingSearch.search', () => {
  it.effect('maps rows into cards and sums both counts', () => {
    const { layer } = fake();
    return Effect.gen(function* () {
      const search = yield* ListingSearch.ListingSearch;
      const page = yield* search.search(params('design'), null);
      assert.strictEqual(page.count, '8');
      assert.strictEqual(page.bountiesCount, 1);
      assert.strictEqual(page.grantsCount, 1);
      const [listing, grant] = page.results;
      assert.deepStrictEqual(listing?.sponsor, {
        name: 'Halcyon',
        slug: 'halcyon',
        logo: null,
        isVerified: true,
      });
      assert.strictEqual(listing?.searchType, 'listing');
      assert.isTrue(listing?.searchType === 'listing' && listing.isFeatured);
      assert.isTrue(
        grant?.searchType === 'grants' &&
          grant.totalApplications === 6 &&
          grant.approvedAmountTotal === 9000,
      );
    }).pipe(Effect.provide(layer));
  });

  it.effect("filters by the viewer's regions when none are given", () => {
    const { calls, layer } = fake({ location: 'India', isBlocked: false });
    return Effect.gen(function* () {
      const search = yield* ListingSearch.ListingSearch;
      yield* search.search(params('design'), 'did:privy:ada');
      const bounties = calls.find(
        (call) =>
          call.sql.includes('LIMIT ?') && call.sql.includes('FROM Bounties'),
      );
      assert.match(bounties?.sql ?? '', /b\.region IN \(\?(,\?)+\)/);
      assert.includeMembers([...(bounties?.values ?? [])], ['Global', 'India']);
    }).pipe(Effect.provide(layer));
  });

  it.effect('keeps regions the caller passed', () => {
    const { calls, layer } = fake({ location: 'India', isBlocked: false });
    return Effect.gen(function* () {
      const search = yield* ListingSearch.ListingSearch;
      yield* search.search(
        params('design', 'userRegion=Global'),
        'did:privy:ada',
      );
      assert.include(calls[1]?.sql ?? '', 'b.region IN (?)');
    }).pipe(Effect.provide(layer));
  });

  it.effect('refuses a blocked searcher', () => {
    const { layer } = fake({ location: null, isBlocked: true });
    return Effect.gen(function* () {
      const search = yield* ListingSearch.ListingSearch;
      const exit = yield* Effect.exit(
        search.search(params('design'), 'did:privy:ada'),
      );
      assert.isTrue(Exit.isFailure(exit));
    }).pipe(Effect.provide(layer));
  });

  it.effect(
    'skips grants unless Open is among the statuses, and binds offsets',
    () => {
      const { calls, layer } = fake();
      return Effect.gen(function* () {
        const search = yield* ListingSearch.ListingSearch;
        const page = yield* search.search(
          params(
            'design',
            'status=CLOSED&bountiesLimit=10&bountiesOffset=20&skills=DESIGN',
          ),
          null,
        );
        assert.isFalse(calls.some((call) => call.sql.includes('FROM Grants')));
        assert.strictEqual(page.count, '7');
        const bounties = calls.at(-1);
        assert.include(bounties?.sql ?? '', 'b.isWinnersAnnounced = 1');
        assert.include(bounties?.sql ?? '', 'OFFSET ?');
        assert.deepStrictEqual(bounties?.values, [
          'design',
          'design',
          'Design',
          10,
          20,
        ]);
      }).pipe(Effect.provide(layer));
    },
  );

  it.effect('gives bounties only the room grants leave', () => {
    const { calls, layer } = fake();
    return Effect.gen(function* () {
      const search = yield* ListingSearch.ListingSearch;
      yield* search.search(
        params('design', 'bountiesLimit=5&grantsLimit=2'),
        null,
      );
      assert.strictEqual(calls.at(-1)?.values.at(-1), 4);
    }).pipe(Effect.provide(layer));
  });
});
