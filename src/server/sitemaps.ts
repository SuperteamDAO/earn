import 'server-only';

import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import type { MetadataRoute } from 'next';

import type { Prisma } from '@/prisma/client';
import * as AppConfig from '@/server/app-config';
import * as Database from '@/server/database';
import * as SiteChapters from '@/server/site-chapters';

import { getAllCategorySlugs } from '@/features/listings/utils/category';
import { getAllRegionSlugs } from '@/features/listings/utils/region';

type Entry = MetadataRoute.Sitemap[number];

// One sitemap holds at most this many URLs.
const MAX_URLS = 50000;

// The sections, in the order their sitemaps are numbered.
const SECTIONS = [
  'static',
  'listings',
  'sponsors',
  'grants',
  'talent',
  'categories',
  'regions',
] as const;
type Section = (typeof SECTIONS)[number];

// Which section a sitemap id falls in, and which page of it, given each
// section's URL count; null past the last.
export const locate = (
  counts: Record<Section, number>,
  id: number,
): { readonly section: Section; readonly page: number } | null => {
  let start = 0;
  for (const section of SECTIONS) {
    const pages = Math.ceil(Math.max(counts[section], 0) / MAX_URLS);
    if (id >= start && id < start + pages) {
      return { section, page: id - start };
    }
    start += pages;
  }
  return null;
};

export const sitemapCount = (counts: Record<Section, number>) =>
  SECTIONS.reduce(
    (total, section) =>
      total + Math.ceil(Math.max(counts[section], 0) / MAX_URLS),
    0,
  );

const staticRoutes = (base: string, now: Date): Array<Entry> => [
  {
    url: `${base}/`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 1.0,
  },
  {
    url: `${base}/collaborate/`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.8,
  },
  {
    url: `${base}/fast-track/`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.8,
  },
  {
    url: `${base}/member-perks/`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  },
  {
    url: `${base}/earn/bounties/`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.95,
  },
  {
    url: `${base}/earn/grants/`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.9,
  },
  {
    url: `${base}/earn/all/`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.9,
  },
  {
    url: `${base}/earn/sponsor/`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  },
  {
    url: `${base}/earn/new/`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.8,
  },
];

const LISTINGS: Prisma.BountiesWhereInput = {
  status: 'OPEN',
  isPublished: true,
  isActive: true,
  isPrivate: false,
  type: { in: ['bounty', 'hackathon'] },
};
const SPONSORS = { isActive: true, isArchived: false } as const;
const GRANTS = {
  isPublished: true,
  isActive: true,
  isArchived: false,
  isPrivate: false,
} as const;
const TALENT = {
  username: { not: null },
  isTalentFilled: true,
  private: false,
  TalentRankings: { some: { totalEarnedInUSD: { gt: 0 } } },
} as const;

// superteam.fun's sitemaps (/sitemap/<id>.xml) and robots.txt. Only Earn's
// production deployment has sitemaps; elsewhere robots.txt disallows all.
// A failure gives an empty sitemap, never an error page.
export class Sitemaps extends Context.Service<
  Sitemaps,
  {
    readonly ids: Effect.Effect<ReadonlyArray<{ readonly id: number }>>;
    readonly entries: (id: string) => Effect.Effect<Array<Entry>>;
    readonly robots: Effect.Effect<string>;
  }
>()('earn/Sitemaps') {}

const make = Effect.gen(function* () {
  const config = yield* AppConfig.AppConfig;
  const db = yield* Database.Database;
  const chapters = yield* SiteChapters.SiteChapters;
  const base = config.siteUrl.replace(/\/+$/, '');

  const regionSlugs = chapters.list.pipe(
    Effect.map((list) =>
      getAllRegionSlugs(
        list.map((chapter) => ({ ...chapter, country: [...chapter.country] })),
      ),
    ),
  );

  const counts = Effect.all(
    {
      static: Effect.succeed(staticRoutes(base, new Date()).length),
      listings: db.query('sitemap.listings.count', (client) =>
        client.bounties.count({ where: LISTINGS }),
      ),
      sponsors: db.query('sitemap.sponsors.count', (client) =>
        client.sponsors.count({ where: SPONSORS }),
      ),
      grants: db.query('sitemap.grants.count', (client) =>
        client.grants.count({ where: GRANTS }),
      ),
      talent: db.query('sitemap.talent.count', (client) =>
        client.user.count({ where: TALENT }),
      ),
      categories: Effect.succeed(getAllCategorySlugs().length),
      regions: regionSlugs.pipe(Effect.map((slugs) => slugs.length)),
    },
    { concurrency: 'unbounded' },
  );

  const ids = Effect.gen(function* () {
    if (!config.earnProduction) return [];
    const total = sitemapCount(yield* counts);
    return Array.from({ length: total }, (_, id) => ({ id }));
  }).pipe(
    Effect.catch(() =>
      Effect.logError('Counting sitemaps failed').pipe(Effect.as([])),
    ),
    Effect.withSpan('Sitemaps.ids'),
  );

  const page = (section: Section, skip: number, now: Date) => {
    const window = { skip, take: MAX_URLS } as const;
    switch (section) {
      case 'static':
        return Effect.succeed(staticRoutes(base, now));
      case 'listings':
        return db
          .query('sitemap.listings', (client) =>
            client.bounties.findMany({
              where: LISTINGS,
              select: { slug: true, deadline: true, updatedAt: true },
              orderBy: { updatedAt: 'desc' },
              ...window,
            }),
          )
          .pipe(
            Effect.map((rows) =>
              rows.map((row): Entry => ({
                url: `${base}/earn/listing/${row.slug}/`,
                lastModified: row.updatedAt,
                changeFrequency:
                  row.deadline && row.deadline > now ? 'weekly' : 'monthly',
                priority: 0.9,
              })),
            ),
          );
      case 'sponsors':
        return db
          .query('sitemap.sponsors', (client) =>
            client.sponsors.findMany({
              where: SPONSORS,
              select: { slug: true, updatedAt: true },
              orderBy: { updatedAt: 'desc' },
              ...window,
            }),
          )
          .pipe(
            Effect.map((rows) =>
              rows.map((row): Entry => ({
                url: `${base}/earn/s/${row.slug}/`,
                lastModified: row.updatedAt,
                changeFrequency: 'weekly',
                priority: 0.7,
              })),
            ),
          );
      case 'grants':
        return db
          .query('sitemap.grants', (client) =>
            client.grants.findMany({
              where: GRANTS,
              select: { slug: true, updatedAt: true },
              orderBy: { updatedAt: 'desc' },
              ...window,
            }),
          )
          .pipe(
            Effect.map((rows) =>
              rows.map((row): Entry => ({
                url: `${base}/earn/grants/${row.slug}/`,
                lastModified: row.updatedAt,
                changeFrequency: 'monthly',
                priority: 0.8,
              })),
            ),
          );
      case 'talent':
        return db
          .query('sitemap.talent', (client) =>
            client.user.findMany({
              where: TALENT,
              select: { username: true, updatedAt: true },
              orderBy: { updatedAt: 'desc' },
              ...window,
            }),
          )
          .pipe(
            Effect.map((rows) =>
              rows.flatMap((row): Array<Entry> => {
                const username = row.username?.trim();
                if (!username) return [];
                return [
                  {
                    url: `${base}/earn/t/${username}/`,
                    lastModified: row.updatedAt,
                    changeFrequency: 'monthly',
                    priority: 0.6,
                  },
                ];
              }),
            ),
          );
      case 'categories':
        return Effect.succeed(
          getAllCategorySlugs()
            .slice(skip, skip + MAX_URLS)
            .map((slug): Entry => ({
              url: `${base}/earn/category/${slug}/`,
              lastModified: now,
              changeFrequency: 'weekly',
              priority: 0.8,
            })),
        );
      default:
        return regionSlugs.pipe(
          Effect.map((slugs) =>
            slugs.slice(skip, skip + MAX_URLS).map((slug): Entry => ({
              url: `${base}/earn/regions/${slug}/`,
              lastModified: now,
              changeFrequency: 'weekly',
              priority: 0.8,
            })),
          ),
        );
    }
  };

  const entries = Effect.fn('Sitemaps.entries')(
    function* (id: string) {
      if (!config.earnProduction) return [];
      const sitemapId = Number.parseInt(id, 10);
      if (Number.isNaN(sitemapId)) return [];
      const found = locate(yield* counts, sitemapId);
      if (!found) return [];
      return yield* page(found.section, found.page * MAX_URLS, new Date());
    },
    Effect.catch(() =>
      Effect.logError('Building a sitemap failed').pipe(Effect.as([])),
    ),
  );

  const robots = Effect.gen(function* () {
    if (!config.earnProduction) return 'User-agent: *\nDisallow: /';
    const sitemapLines = (yield* ids)
      .map(({ id }) => `Sitemap: ${base}/sitemap/${id}.xml`)
      .join('\n');
    return `User-agent: *
Allow: /
Disallow: /earn/dashboard/
Disallow: /auth/
Disallow: /earn/signin
Disallow: /earn/signup
${sitemapLines}`.trim();
  }).pipe(Effect.withSpan('Sitemaps.robots'));

  return Sitemaps.of({ ids, entries, robots });
});

export const layer = Layer.effect(Sitemaps, make);
