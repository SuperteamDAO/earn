import { assert, describe, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import * as Database from '@/server/database';
import { groupPerks } from '@/server/member-perks';
import * as SiteChapters from '@/server/site-chapters';
import * as Sitemaps from '@/server/sitemaps';

const chapterRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'c1',
  name: 'Superteam India',
  region: 'India',
  displayValue: null,
  slug: 'india',
  code: 'IN',
  countries: ['India', 42],
  banner: null,
  icons: null,
  link: null,
  hello: null,
  nationality: null,
  ...overrides,
});

const fakeDatabase = (users: Array<unknown> = []) => {
  const queries: Array<string> = [];
  const args: Array<unknown> = [];
  const layer = Layer.succeed(
    Database.Database,
    Database.Database.of({
      query: (operation, run) => {
        queries.push(operation);
        return Effect.promise(() =>
          run({
            chapter: {
              findMany: async () => [
                chapterRow(),
                chapterRow({
                  id: 'c2',
                  name: 'Superteam Balkan',
                  region: 'Balkan',
                  displayValue: 'Balkan',
                  slug: 'balkan',
                  code: null,
                  countries: 'not a list',
                }),
              ],
            },
            user: {
              findMany: async (query: unknown) => {
                args.push(query);
                return users;
              },
            },
          } as never),
        );
      },
    }),
  );
  return { queries, args, layer };
};

describe('SiteChapters', () => {
  it.effect("shapes chapters as Earn's getChapterRegions did, cached", () =>
    Effect.gen(function* () {
      const database = fakeDatabase();
      const result = yield* Effect.gen(function* () {
        const chapters = yield* SiteChapters.SiteChapters;
        const first = yield* chapters.list;
        yield* chapters.list;
        return first;
      }).pipe(
        Effect.provide(SiteChapters.layer.pipe(Layer.provide(database.layer))),
      );
      assert.strictEqual(result[0]?.displayValue, 'India');
      assert.deepStrictEqual(result[0]?.country, ['India']);
      assert.strictEqual(result[1]?.code, '');
      assert.deepStrictEqual(result[1]?.country, []);
      assert.deepStrictEqual(database.queries, ['chapters.active']);
    }),
  );

  it.effect('lists countries once each, sorted', () =>
    SiteChapters.SiteChapters.use((chapters) => chapters.countries).pipe(
      Effect.map((countries) =>
        assert.deepStrictEqual(countries, ['Balkan', 'India']),
      ),
      Effect.provide(
        SiteChapters.layer.pipe(Layer.provide(fakeDatabase().layer)),
      ),
    ),
  );

  it.effect('names core members, falling back to their People record', () =>
    Effect.gen(function* () {
      const database = fakeDatabase([
        { id: 'u1', firstName: 'Ada', lastName: 'L', people: null },
        { id: 'u2', firstName: null, lastName: null, people: { name: 'Bo' } },
        { id: 'u3', firstName: null, lastName: null, people: null },
      ]);
      const members = yield* SiteChapters.SiteChapters.use((chapters) =>
        chapters.coreMembers('c1'),
      ).pipe(
        Effect.provide(SiteChapters.layer.pipe(Layer.provide(database.layer))),
      );
      assert.deepStrictEqual(members, [
        { id: 'u1', name: 'Ada L' },
        { id: 'u2', name: 'Bo' },
      ]);
      assert.deepNestedInclude(database.args[0], {
        'where.isBlocked': false,
        'where.people.is.chapterId': 'c1',
      });
    }),
  );
});

describe('Sitemaps.locate', () => {
  const counts = {
    static: 9,
    listings: 120_000,
    sponsors: 0,
    grants: 10,
    talent: 50_000,
    categories: 4,
    regions: 80,
  };

  it('numbers sitemaps section by section, 50,000 URLs each', () => {
    assert.strictEqual(Sitemaps.sitemapCount(counts), 8);
    assert.deepStrictEqual(Sitemaps.locate(counts, 0), {
      section: 'static',
      page: 0,
    });
    assert.deepStrictEqual(Sitemaps.locate(counts, 3), {
      section: 'listings',
      page: 2,
    });
    // No sponsors, so grants follow listings.
    assert.deepStrictEqual(Sitemaps.locate(counts, 4), {
      section: 'grants',
      page: 0,
    });
    assert.deepStrictEqual(Sitemaps.locate(counts, 7), {
      section: 'regions',
      page: 0,
    });
    assert.isNull(Sitemaps.locate(counts, 8));
  });
});

describe('groupPerks', () => {
  it('groups by status, newest first', () => {
    const perks = groupPerks([
      {
        createdTime: '2026-01-01T00:00:00Z',
        fields: { Name: 'Old', Status: 'Live now' },
      },
      {
        createdTime: '2026-02-01T00:00:00Z',
        fields: {
          Name: 'New',
          Status: 'Live now',
          Logo: [{ url: 'https://x/logo.png' }],
        },
      },
      { fields: { Name: 'Done', Status: 'Completed' } },
      { fields: { Name: 'Hidden', Status: 'Draft' } },
    ]);
    assert.deepStrictEqual(
      perks.liveNow.map((perk) => perk.fields.Name),
      ['New', 'Old'],
    );
    assert.deepStrictEqual(perks.liveNow[0]?.fields.Logo, [
      { url: 'https://x/logo.png' },
    ]);
    assert.strictEqual(perks.completed.length, 1);
    assert.strictEqual(perks.comingSoon.length, 0);
  });
});
