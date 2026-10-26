import 'server-only';

import * as Context from 'effect/Context';
import * as Duration from 'effect/Duration';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import type { ChapterRegionData } from '@/interface/chapter';
import type { GrantsSelect } from '@/prisma/models/Grants';
import * as Database from '@/server/database';
import { toJson } from '@/server/grant-json';

import { grantsSelect } from '@/features/grants/constants/schema';
import {
  type UserApplicationResponse,
  userApplicationSelect,
} from '@/features/grants/constants/userApplication';
import type { GrantWithApplicationCount } from '@/features/grants/types';
import type { GrantCardData } from '@/features/home/types/cards';
import {
  filterRegionCountry,
  getCombinedRegion,
  getParentRegions,
} from '@/features/listings/utils/region';

// Earn's getGrantBySlug: the grant page's grant, with its approved total and
// recipients.
const GRANT_PAGE = {
  id: true,
  title: true,
  slug: true,
  description: true,
  shortDescription: true,
  token: true,
  minReward: true,
  maxReward: true,
  totalPaid: true,
  historicalApplications: true,
  link: true,
  sponsorId: true,
  pocId: true,
  isPublished: true,
  isFeatured: true,
  isActive: true,
  isArchived: true,
  isPaused: true,
  createdAt: true,
  updatedAt: true,
  skills: true,
  logo: true,
  region: true,
  questions: true,
  pocSocials: true,
  status: true,
  avgResponseTime: true,
  isNative: true,
  airtableId: true,
  references: true,
  isST: true,
  sponsor: {
    select: {
      name: true,
      logo: true,
      slug: true,
      isVerified: true,
      entityName: true,
    },
  },
  _count: {
    select: {
      GrantApplication: {
        where: {
          OR: [
            { applicationStatus: 'Approved' },
            { applicationStatus: 'Completed' },
          ],
        },
      },
    },
  },
  GrantApplication: {
    where: {
      OR: [
        { applicationStatus: 'Approved' },
        { applicationStatus: 'Completed' },
      ],
    },
    select: { approvedAmountInUSD: true },
  },
} satisfies GrantsSelect;

export class GrantPages extends Context.Service<
  GrantPages,
  {
    // The public grant page's grant; null when there's no such slug.
    readonly bySlug: (
      slug: string,
    ) => Effect.Effect<
      GrantWithApplicationCount | null,
      Database.DatabaseError
    >;
    // Superteam's active chapters, as /api/chapters lists them.
    readonly chapters: Effect.Effect<
      ReadonlyArray<ChapterRegionData>,
      Database.DatabaseError
    >;
    // The sidebar's live grants, for the viewer's region when signed in.
    readonly liveGrants: (
      location: string | null | undefined,
      signedIn: boolean,
      excludeId: string,
    ) => Effect.Effect<ReadonlyArray<GrantCardData>, Database.DatabaseError>;
    // Their latest application to the grant that isn't completed (Earn's
    // /api/grant-application/get).
    readonly mine: (
      userId: string,
      grantId: string,
    ) => Effect.Effect<UserApplicationResponse | null, Database.DatabaseError>;
    // A token's icon as a PNG the OG image can draw (Earn's getTokenIcon).
    readonly tokenIcon: (
      symbol: string | null,
    ) => Effect.Effect<string | null, Database.DatabaseError>;
  }
>()('earn/GrantPages') {}

const make = Effect.gen(function* () {
  const database = yield* Database.Database;

  const bySlug = Effect.fn('GrantPages.bySlug')(function* (slug: string) {
    const grant = yield* database.query('grantBySlug', (client) =>
      client.grants.findFirst({ where: { slug }, select: GRANT_PAGE }),
    );
    if (!grant) return null;
    const { GrantApplication, _count, ...rest } = grant;
    const page = {
      ...rest,
      approvedAmountTotal: GrantApplication.reduce(
        (sum, application) => sum + (application.approvedAmountInUSD || 0),
        0,
      ),
      totalApplications:
        _count.GrantApplication + (grant.historicalApplications ?? 0),
    };
    // Earn's Grant type, as its page props always carried it.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    return toJson(page) as unknown as GrantWithApplicationCount;
  });

  // Earn's getChapterRegions, kept five minutes.
  const [chapters] = yield* Effect.cachedInvalidateWithTTL(
    database
      .query('chapterRegions', (client) =>
        client.chapter.findMany({
          where: { active: true },
          select: {
            id: true,
            name: true,
            region: true,
            displayValue: true,
            slug: true,
            code: true,
            countries: true,
            banner: true,
            icons: true,
            link: true,
            hello: true,
            nationality: true,
          },
        }),
      )
      .pipe(
        Effect.map((rows) =>
          rows.map((chapter): ChapterRegionData => ({
            id: chapter.id,
            name: chapter.name,
            region: chapter.region,
            displayValue: chapter.displayValue || chapter.region,
            slug: chapter.slug,
            code: chapter.code || '',
            country: Array.isArray(chapter.countries)
              ? chapter.countries.filter(
                  (country): country is string => typeof country === 'string',
                )
              : [],
            icons: chapter.icons || undefined,
            banner: chapter.banner || undefined,
            link: chapter.link || undefined,
            hello: chapter.hello || undefined,
            nationality: chapter.nationality || undefined,
          })),
        ),
      ),
    Duration.minutes(5),
  );

  // Earn's /api/grants/live with take=5 and the page's grant left out.
  const liveGrants = Effect.fn('GrantPages.liveGrants')(function* (
    location: string | null | undefined,
    signedIn: boolean,
    excludeId: string,
  ) {
    let region: Array<string> | null = null;
    if (signedIn) {
      const all = yield* chapters;
      const matched = location
        ? getCombinedRegion(location, true, [...all])
        : undefined;
      region = matched?.name
        ? [
            matched.name,
            'Global',
            ...(filterRegionCountry(matched, location || '').country || []),
            ...(getParentRegions(matched) || []),
          ]
        : ['Global'];
    }
    const rows = yield* database.query('liveGrants', (client) =>
      client.grants.findMany({
        where: {
          isPublished: true,
          isActive: true,
          isArchived: false,
          isPrivate: false,
          id: { notIn: [excludeId] },
          ...(region ? { region: { in: region } } : {}),
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: grantsSelect,
      }),
    );
    const grants = rows.map(({ GrantApplication, _count, ...grant }) => ({
      ...grant,
      approvedAmountTotal: GrantApplication.reduce(
        (sum, application) => sum + (application.approvedAmountInUSD || 0),
        0,
      ),
      totalApplications: _count.GrantApplication + grant.historicalApplications,
    }));
    return grants satisfies ReadonlyArray<GrantCardData>;
  });

  const mine = Effect.fn('GrantPages.mine')(function* (
    userId: string,
    grantId: string,
  ) {
    const row = yield* database.query('myGrantApplication', (client) =>
      client.grantApplication.findFirst({
        where: {
          userId,
          grantId,
          applicationStatus: { not: { in: ['Completed'] } },
        },
        orderBy: { createdAt: 'desc' },
        select: userApplicationSelect,
      }),
    );
    return row ? toJson(row) : null;
  });

  const tokenIcon = Effect.fn('GrantPages.tokenIcon')(function* (
    symbol: string | null,
  ) {
    if (!symbol) return null;
    const token = yield* database.query('tokenIcon', (client) =>
      client.tokenMetadata.findFirst({
        where: { tokenSymbol: symbol },
        select: { icon: true },
      }),
    );
    const icon = token?.icon;
    if (!icon || !icon.startsWith('/api/token-icon?')) return icon ?? null;
    const proxy = new URL(icon, 'https://superteam.fun');
    proxy.searchParams.set('format', 'png');
    return `${proxy.pathname}${proxy.search}`;
  });

  return GrantPages.of({ bySlug, chapters, liveGrants, mine, tokenIcon });
});

export const layer = Layer.effect(GrantPages, make);
