import { assert, describe, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Layer from 'effect/Layer';

import * as Database from '@/server/database';
import * as Hackathons from '@/server/hackathons';
import * as HomeChapters from '@/server/home-chapters';
import type { ChapterRegion } from '@/server/home-regions';

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

interface Sub {
  id: string;
  userId: string;
  hackathonId: string;
  isArchived: boolean;
}

// A stand-in for Prisma: only the calls the service makes, recording what
// it was asked.
const fake = () => {
  const calls: { op: string; args: unknown }[] = [];
  const subs: Sub[] = [];
  const hackathon = {
    id: 'h1',
    slug: 'radar',
    name: 'Radar',
    deadline: new Date('2024-10-10T00:00:00Z'),
    startDate: new Date('2024-10-02T00:00:00Z'),
    announceDate: null,
    altLogo: 'alt.png',
  };
  const client = {
    hackathon: {
      findUnique: async ({ where }: { where: { slug?: string } }) =>
        where.slug === 'radar' ? hackathon : null,
    },
    bounties: {
      findMany: async (args: unknown) => {
        calls.push({ op: 'bounties.findMany', args });
        return [];
      },
      count: async () => 7,
      aggregate: async () => ({ _sum: { usdValue: 1234.5 } }),
    },
    user: {
      findUnique: async () => ({ isTalentFilled: true, location: 'Serbia' }),
      findMany: async () => [
        {
          id: 'u1',
          username: 'ada',
          firstName: 'Ada',
          lastName: null,
          photo: null,
          email: 'ada@example.com',
        },
        {
          id: 'u2',
          username: 'bo',
          firstName: 'Bo',
          lastName: null,
          photo: null,
          email: 'bo@example.com',
        },
      ],
    },
    $queryRaw: async () => [{ location: 'Serbia', submission_count: 3n }],
    subscribeHackathon: {
      findFirst: async ({
        where,
      }: {
        where: { hackathonId: string; userId: string };
      }) =>
        subs.find(
          (sub) =>
            sub.hackathonId === where.hackathonId &&
            sub.userId === where.userId,
        ) ?? null,
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: { isArchived: boolean };
      }) => {
        const sub = subs.find((item) => item.id === where.id);
        if (!sub) throw new Error('missing');
        sub.isArchived = data.isArchived;
        return sub;
      },
      create: async ({
        data,
      }: {
        data: { hackathonId: string; userId: string };
      }) => {
        const sub = { id: `s${subs.length + 1}`, isArchived: false, ...data };
        subs.push(sub);
        return sub;
      },
    },
  };
  const layer = Hackathons.layer.pipe(
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
  return { layer, calls, subs };
};

const NOW = new Date('2026-10-26T00:00:00Z');

describe('hackathonListQuery', () => {
  it('lists the named hackathons by default, open, richest first', () => {
    const { where, orderBy, take } = Hackathons.hackathonListQuery(
      Hackathons.DEFAULT_LIST_QUERY,
      null,
      NOW,
    );
    assert.deepStrictEqual(where.Hackathon, {
      name: { in: ['Mobius', 'Redacted', 'Breakout', 'Frontier', 'World Cup'] },
    });
    assert.strictEqual(where.type, 'hackathon');
    assert.strictEqual(where.isPrivate, false);
    assert.isUndefined(where.region);
    assert.deepStrictEqual(where.AND, [
      {
        isWinnersAnnounced: false,
        OR: [{ deadline: null }, { deadline: { gte: NOW } }],
      },
    ]);
    assert.deepStrictEqual(orderBy, {
      usdValue: { sort: 'desc', nulls: 'last' },
    });
    assert.isUndefined(take);
  });

  it('limits the homepage to ten English listings worth over $100', () => {
    const { where, take } = Hackathons.hackathonListQuery(
      {
        ...Hackathons.DEFAULT_LIST_QUERY,
        context: 'home',
        status: 'completed',
      },
      ['Global'],
      NOW,
    );
    assert.strictEqual(take, 10);
    assert.deepStrictEqual(where.region, { in: ['Global'] });
    assert.deepStrictEqual(Array.isArray(where.AND) ? where.AND[1] : null, {
      isWinnersAnnounced: true,
    });
  });

  it('sorts by submissions and filters one hackathon', () => {
    const { where, orderBy } = Hackathons.hackathonListQuery(
      {
        ...Hackathons.DEFAULT_LIST_QUERY,
        name: 'Mobius',
        sortBy: 'Submissions',
        order: 'asc',
        status: 'review',
      },
      null,
      NOW,
    );
    assert.deepStrictEqual(where.Hackathon, { name: 'Mobius' });
    assert.deepStrictEqual(orderBy, { Submission: { _count: 'asc' } });
    assert.deepStrictEqual(where.AND, [
      { isWinnersAnnounced: false, deadline: { lt: NOW } },
    ]);
  });
});

describe('Hackathons.list', () => {
  it.effect("keeps a talent to their region's listings", () => {
    const db = fake();
    return Effect.gen(function* () {
      const hackathons = yield* Hackathons.Hackathons;
      yield* hackathons.list(Hackathons.DEFAULT_LIST_QUERY, {
        isTalentFilled: true,
        location: 'Serbia',
      });
      const args = db.calls[0]?.args as { where: { region: { in: string[] } } };
      assert.deepStrictEqual(args.where.region.in.toSorted(), [
        'Balkan',
        'Global',
        'Serbia',
      ]);
    }).pipe(Effect.provide(db.layer));
  });

  it.effect('shows everyone everything without a profile', () => {
    const db = fake();
    return Effect.gen(function* () {
      const hackathons = yield* Hackathons.Hackathons;
      yield* hackathons.list(Hackathons.DEFAULT_LIST_QUERY, {
        isTalentFilled: false,
        location: 'Serbia',
      });
      const args = db.calls[0]?.args as { where: { region?: unknown } };
      assert.isUndefined(args.where.region);
    }).pipe(Effect.provide(db.layer));
  });
});

describe('Hackathons.publicStats', () => {
  it.effect('sums the open tracks and reports the dates', () => {
    const db = fake();
    return Effect.gen(function* () {
      const hackathons = yield* Hackathons.Hackathons;
      const stats = yield* hackathons.publicStats('radar');
      assert.deepStrictEqual(stats, {
        totalRewardAmount: 1234.5,
        totalListings: 7,
        deadline: '2024-10-10T00:00:00.000Z',
        startDate: '2024-10-02T00:00:00.000Z',
        announceDate: '',
      });
    }).pipe(Effect.provide(db.layer));
  });

  it.effect('fails for an unknown hackathon', () => {
    const db = fake();
    return Effect.gen(function* () {
      const hackathons = yield* Hackathons.Hackathons;
      const exit = yield* Effect.exit(hackathons.publicStats('nope'));
      assert.isTrue(Exit.isFailure(exit));
    }).pipe(Effect.provide(db.layer));
  });
});

describe('Hackathons.toggleSubscription', () => {
  it.effect('subscribes, then flips the subscription off and on', () => {
    const db = fake();
    return Effect.gen(function* () {
      const hackathons = yield* Hackathons.Hackathons;
      yield* hackathons.toggleSubscription('u1', 'radar');
      assert.deepStrictEqual(db.subs, [
        { id: 's1', isArchived: false, hackathonId: 'h1', userId: 'u1' },
      ]);
      yield* hackathons.toggleSubscription('u1', 'radar');
      assert.isTrue(db.subs[0]?.isArchived);
      yield* hackathons.toggleSubscription('u1', 'radar');
      assert.isFalse(db.subs[0]?.isArchived);
      assert.strictEqual(db.subs.length, 1);
    }).pipe(Effect.provide(db.layer));
  });

  it.effect('refuses an unknown hackathon without writing', () => {
    const db = fake();
    return Effect.gen(function* () {
      const hackathons = yield* Hackathons.Hackathons;
      const exit = yield* Effect.exit(
        hackathons.toggleSubscription('u1', 'nope'),
      );
      assert.isTrue(Exit.isFailure(exit));
      assert.strictEqual(db.subs.length, 0);
    }).pipe(Effect.provide(db.layer));
  });
});

describe('Hackathons.talentOlympics', () => {
  it.effect('ranks profiles by rating and returns no emails', () => {
    const db = fake();
    return Effect.gen(function* () {
      const hackathons = yield* Hackathons.Hackathons;
      const { rankings, countryLeaders } = yield* hackathons.talentOlympics([
        { email: 'ada@example.com', rating: 50 },
        { email: 'missing@example.com', rating: 99 },
        { email: 'bo@example.com', rating: 70 },
      ]);
      assert.deepStrictEqual(
        rankings.map((item) => [item.user.id, item.rating]),
        [
          ['u2', 70],
          ['u1', 50],
        ],
      );
      for (const { user } of rankings) assert.isFalse('email' in user);
      assert.isFalse(JSON.stringify(rankings).includes('@example.com'));
      assert.deepStrictEqual(countryLeaders[0], {
        location: 'Serbia',
        submission_count: 3,
      });
      assert.strictEqual(countryLeaders.length, 10);
    }).pipe(Effect.provide(db.layer));
  });
});
