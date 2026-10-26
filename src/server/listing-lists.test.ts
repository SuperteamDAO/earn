import { assert, describe, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';

import * as Database from '@/server/database';
import * as GrantLists from '@/server/grant-lists';
import * as HomeChapters from '@/server/home-chapters';
import type { ChapterRegion } from '@/server/home-regions';
import * as ListingLists from '@/server/listing-lists';

const balkan: ChapterRegion = {
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

const NOW = new Date('2026-10-26T00:00:00Z');

const query = (
  overrides: Partial<ListingLists.ListQuery> = {},
): ListingLists.ListQuery => ({ ...ListingLists.LIST_DEFAULTS, ...overrides });

const talent: ListingLists.ListViewer = {
  id: 'u1',
  isTalentFilled: true,
  location: 'Serbia',
  skills: [{ skills: 'Design' }, { skills: 'Frontend' }],
};

const build = (
  overrides: Partial<ListingLists.ListQuery>,
  viewer: ListingLists.ListViewer | null = null,
) =>
  ListingLists.listingQuery(
    query(overrides),
    viewer,
    [balkan],
    ['crypto-worlds-fair'],
    NOW,
  );

describe('listingQuery', () => {
  it('lists public bounties and featured hackathons, featured first', () => {
    const { where, orderBy, take } = build({});
    assert.strictEqual(where.isPublished, true);
    assert.strictEqual(where.isPrivate, false);
    assert.strictEqual(where.hackathonprize, false);
    assert.deepStrictEqual(where.OR, [
      { type: 'bounty' },
      { type: 'hackathon', isFeatured: true },
    ]);
    assert.deepStrictEqual(orderBy, [
      { isFeatured: 'desc' },
      { deadline: { sort: 'asc', nulls: 'last' } },
    ]);
    assert.strictEqual(take, undefined);
    assert.deepStrictEqual(where.AND, [
      {
        isWinnersAnnounced: false,
        OR: [{ deadline: null }, { deadline: { gte: NOW } }],
      },
    ]);
  });

  it('keeps the homepage to ten fixed, English bounties over $100', () => {
    const { where, take } = build({ context: 'home' });
    assert.strictEqual(take, 10);
    assert.deepStrictEqual(Array.isArray(where.AND) ? where.AND[0] : null, {
      language: { in: ['eng', 'sco'] },
      compensationType: 'fixed',
      usdValue: { gt: 100 },
    });
  });

  it("shows a talent only Global and their chapter's regions", () => {
    const { where } = build({}, talent);
    assert.deepStrictEqual(where.region, {
      in: ['Global', 'Serbia', 'Balkan'],
    });
    // Outside every chapter: Global only.
    const elsewhere = build({}, { ...talent, location: 'Peru' });
    assert.deepStrictEqual(elsewhere.where.region, { in: ['Global'] });
    // Not on region, sponsor or category pages.
    assert.strictEqual(
      build({ context: 'region' }, talent).where.region,
      undefined,
    );
  });

  it('builds For You from bookmarks, skills and featured listings', () => {
    const { where } = build({ category: 'For You' }, talent);
    assert.deepStrictEqual(Array.isArray(where.AND) ? where.AND[0] : null, {
      OR: [
        { SubscribeBounty: { some: { userId: 'u1' } } },
        { skills: { path: '$[*].skills', array_contains: ['Design'] } },
        { skills: { path: '$[*].skills', array_contains: ['Frontend'] } },
        { isFeatured: true },
      ],
    });
  });

  it("scopes a chapter page to its regions or the chapter's own listings", () => {
    const { where } = build({ context: 'region', region: 'Balkan' });
    assert.deepStrictEqual(Array.isArray(where.AND) ? where.AND[0] : null, {
      OR: [
        { region: { in: ['Balkan', 'Serbia', 'Croatia', 'Global'] } },
        { sponsor: { name: 'Superteam Balkan' } },
      ],
    });
  });

  it('filters by skill group and status, and sorts by the chosen column', () => {
    const { where, orderBy } = build({
      category: 'Development',
      status: 'review',
      sortBy: 'Date',
    });
    assert.deepStrictEqual(where.AND, [
      { isWinnersAnnounced: false, deadline: { lt: NOW } },
      {
        OR: ['Frontend', 'Backend', 'Blockchain', 'Mobile'].map((skill) => ({
          skills: { path: '$[*].skills', array_contains: [skill] },
        })),
      },
    ]);
    // Expired: newest first.
    assert.deepStrictEqual(orderBy, {
      deadline: { sort: 'desc', nulls: 'last' },
    });
    assert.deepStrictEqual(build({ sortBy: 'Prize', order: 'desc' }).orderBy, {
      usdValue: { sort: 'desc', nulls: 'last' },
    });
  });

  it('narrows to a tab: bounties, or a hackathon', () => {
    assert.strictEqual(build({ tab: 'bounties' }).where.type, 'bounty');
    const hackathon = build({ tab: 'crypto-worlds-fair' }).where;
    assert.strictEqual(hackathon.type, 'hackathon');
    assert.deepStrictEqual(hackathon.Hackathon, { slug: 'crypto-worlds-fair' });
  });
});

describe('list parameters', () => {
  it('defaults missing ones and refuses wrong ones', () => {
    assert.deepStrictEqual(
      ListingLists.decodeListQuery({ context: 'home' }),
      Option.some({ ...ListingLists.LIST_DEFAULTS, context: 'home' }),
    );
    assert.isTrue(
      Option.isNone(ListingLists.decodeListQuery({ status: 'nope' })),
    );
  });

  it("falls back to the page's defaults on a page", () => {
    assert.deepStrictEqual(
      ListingLists.pageListQuery(
        { status: 'nope', category: 'Design' },
        ListingLists.LIST_DEFAULTS,
      ),
      {
        tab: 'all',
        order: 'asc',
        category: 'Design',
        status: 'open',
        sortBy: 'Date',
      },
    );
  });
});

const row = (id: string, isFeatured: boolean, deadline: Date | null) => ({
  id,
  isFeatured,
  isWinnersAnnounced: false,
  deadline,
});

describe('featuredOngoingFirst', () => {
  it('moves open featured listings first, keeping the order', () => {
    const past = new Date('2026-01-01');
    const sorted = ListingLists.featuredOngoingFirst(
      [
        row('a', false, null),
        row('b', true, past),
        row('c', true, null),
        row('d', true, new Date('2027-01-01')),
      ],
      NOW,
    );
    assert.deepStrictEqual(
      sorted.map((item) => item.id),
      ['c', 'd', 'a', 'b'],
    );
  });
});

// A stand-in for Prisma: only the calls the services make.
const fakeDatabase = (user: Record<string, unknown> | null) => {
  const asked: unknown[] = [];
  const client = {
    user: { findUnique: async () => user },
    bounties: {
      findMany: async (args: unknown) => {
        asked.push(args);
        return [];
      },
      count: async () => 3,
    },
    grants: {
      findMany: async () => [
        {
          id: 'g1',
          slug: 'g',
          title: 'G',
          minReward: 1,
          maxReward: 2,
          token: 'USDC',
          historicalApplications: 4,
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
      ],
    },
  };
  const layer = Layer.mergeAll(ListingLists.layer, GrantLists.layer).pipe(
    Layer.provide(
      Layer.succeed(
        HomeChapters.HomeChapters,
        HomeChapters.HomeChapters.of({ all: Effect.succeed([balkan]) }),
      ),
    ),
    Layer.provide(
      Layer.succeed(
        Database.Database,
        Database.Database.of({
          query: (_operation, run) =>
            Effect.promise(() => run(client as never)),
        }),
      ),
    ),
  );
  return { layer, asked };
};

describe('ListingLists', () => {
  it.effect('refuses a blocked viewer', () =>
    Effect.gen(function* () {
      const lists = yield* ListingLists.ListingLists;
      const exit = yield* Effect.exit(lists.viewer('did:privy:x'));
      assert.isTrue(Exit.isFailure(exit));
    }).pipe(
      Effect.provide(
        fakeDatabase({
          id: 'u',
          isTalentFilled: true,
          location: null,
          skills: [],
          isBlocked: true,
        }).layer,
      ),
    ),
  );

  it.effect('gives signed-out visitors no bookmarks without asking', () => {
    const database = fakeDatabase(null);
    return Effect.gen(function* () {
      const lists = yield* ListingLists.ListingLists;
      const listings = yield* lists.list(query({ context: 'bookmarks' }), null);
      assert.deepStrictEqual(listings, []);
      assert.strictEqual(database.asked.length, 0);
      const counts = yield* lists.counts(query({ context: 'bookmarks' }), null);
      assert.strictEqual(counts.All, 0);
    }).pipe(Effect.provide(database.layer));
  });

  it.effect('counts every category pill', () =>
    Effect.gen(function* () {
      const lists = yield* ListingLists.ListingLists;
      const counts = yield* lists.counts(query(), talent);
      assert.deepStrictEqual(counts, {
        'For You': 3,
        All: 3,
        Content: 3,
        Design: 3,
        Development: 3,
        Other: 3,
      });
    }).pipe(Effect.provide(fakeDatabase(null).layer)),
  );
});

describe('GrantLists', () => {
  it.effect('totals approved amounts and applications', () =>
    Effect.gen(function* () {
      const lists = yield* GrantLists.GrantLists;
      const [grant] = yield* lists.list(
        { context: 'all', category: 'All' },
        null,
      );
      assert.strictEqual(grant?.approvedAmountTotal, 100);
      assert.strictEqual(grant?.totalApplications, 6);
    }).pipe(Effect.provide(fakeDatabase(null).layer)),
  );

  it('scopes grants to a talent region, or a region page', () => {
    assert.deepStrictEqual(
      GrantLists.grantQuery(
        { context: 'home', category: 'All' },
        { isTalentFilled: true, location: 'Serbia' },
        [balkan],
      ),
      {
        where: {
          isPublished: true,
          isActive: true,
          isArchived: false,
          isPrivate: false,
          region: { in: ['Global', 'Serbia', 'Balkan'] },
        },
        take: 10,
      },
    );
    assert.deepStrictEqual(
      GrantLists.grantQuery(
        { context: 'region', category: 'Design', region: 'Peru' },
        null,
        [balkan],
      ).where.region,
      { in: ['Peru', 'Global', 'Latin America'] },
    );
  });
});
