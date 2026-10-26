import 'server-only';

import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import type * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';

import type { GrantsSelect, GrantsWhereInput } from '@/prisma/models/Grants';
import * as Database from '@/server/database';
import * as HomeChapters from '@/server/home-chapters';
import {
  type ChapterRegion,
  regionScope,
  regionsForUserLocation,
} from '@/server/home-regions';

import type { GrantCardData } from '@/features/home/types/cards';

// Earn's grant list parameters (features/grants/constants/schema.ts).
const GRANT_CATEGORIES = [
  'All',
  'Content',
  'Design',
  'Development',
  'Other',
] as const;
export type GrantCategory = (typeof GRANT_CATEGORIES)[number];

export const GrantListQuery = Schema.Struct({
  category: Schema.Literals(GRANT_CATEGORIES),
  context: Schema.Literals(['home', 'all', 'region', 'sponsor', 'category']),
  region: Schema.optional(Schema.String),
  sponsor: Schema.optional(Schema.String),
});
export type GrantListQuery = typeof GrantListQuery.Type;

export const decodeGrantListQuery = (
  params: Readonly<Record<string, string | undefined>>,
): Option.Option<GrantListQuery> =>
  Schema.decodeUnknownOption(GrantListQuery)({
    category: params.category || 'All',
    context: params.context || 'all',
    ...(params.region ? { region: params.region } : {}),
    ...(params.sponsor ? { sponsor: params.sponsor } : {}),
  });

export const asGrantCategory = (value: string | undefined): GrantCategory =>
  GRANT_CATEGORIES.find((category) => category === value) ?? 'All';

// Who's looking, as the grant list's region rule uses them.
export interface GrantViewer {
  readonly isTalentFilled: boolean;
  readonly location: string | null;
}

// Earn's grantsSelect.
const GRANT_CARD = {
  id: true,
  slug: true,
  title: true,
  minReward: true,
  maxReward: true,
  token: true,
  historicalApplications: true,
  totalPaid: true,
  logo: true,
  isST: true,
  sponsor: {
    select: { id: true, name: true, slug: true, logo: true, isVerified: true },
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
} as const satisfies GrantsSelect;

const SKILLS_OF: Record<string, ReadonlyArray<string>> = {
  Development: ['Frontend', 'Backend', 'Blockchain', 'Mobile'],
  Design: ['Design'],
  Content: ['Content'],
  Other: ['Other', 'Growth', 'Community'],
};

// Earn's buildGrantsQuery (features/grants/utils/query-builder.ts), pure.
export function grantQuery(
  query: GrantListQuery,
  viewer: GrantViewer | null,
  chapters: ReadonlyArray<ChapterRegion>,
): { readonly where: GrantsWhereInput; readonly take?: number } {
  const { category, context, region, sponsor } = query;
  const where: GrantsWhereInput = {
    isPublished: true,
    isActive: true,
    isArchived: false,
    isPrivate: false,
  };

  if (viewer?.isTalentFilled && (context === 'all' || context === 'home')) {
    where.region = { in: regionsForUserLocation(chapters, viewer.location) };
  }

  if (context === 'region' && region) {
    where.region = { in: regionScope(chapters, region).regions };
  }

  if (context === 'sponsor' && sponsor) {
    where.sponsor = { slug: sponsor.toLowerCase() };
  }

  const skills = category === 'All' ? [] : (SKILLS_OF[category] ?? []);
  if (skills.length > 0) {
    where.AND = [
      category === 'Development' || category === 'Other'
        ? {
            OR: skills.map((skill) => ({
              skills: { path: '$[*].skills', array_contains: [skill] },
            })),
          }
        : { skills: { path: '$[*].skills', array_contains: [...skills] } },
    ];
  }

  return { where, ...(context === 'home' ? { take: 10 } : {}) };
}

export type GrantRow = GrantCardData & { readonly id: string };

export class GrantLists extends Context.Service<
  GrantLists,
  {
    readonly list: (
      query: GrantListQuery,
      viewer: GrantViewer | null,
    ) => Effect.Effect<ReadonlyArray<GrantRow>, Database.DatabaseError>;
  }
>()('earn/GrantLists') {}

const make = Effect.gen(function* () {
  const database = yield* Database.Database;
  const chapters = yield* HomeChapters.HomeChapters;

  const list = Effect.fn('GrantLists.list')(function* (
    query: GrantListQuery,
    viewer: GrantViewer | null,
  ) {
    const { where, take } = grantQuery(query, viewer, yield* chapters.all);
    const rows = yield* database.query('grants', (client) =>
      client.grants.findMany({
        where,
        take,
        orderBy: { createdAt: 'desc' },
        select: GRANT_CARD,
      }),
    );
    return rows.map(({ GrantApplication, _count, ...grant }): GrantRow => ({
      ...grant,
      approvedAmountTotal: GrantApplication.reduce(
        (sum, application) => sum + (application.approvedAmountInUSD || 0),
        0,
      ),
      totalApplications: _count.GrantApplication + grant.historicalApplications,
    }));
  });

  return GrantLists.of({ list });
});

export const layer = Layer.effect(GrantLists, make);
