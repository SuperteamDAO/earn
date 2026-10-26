import 'server-only';

import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import type * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';

import type {
  BountiesOrderByWithRelationInput,
  BountiesSelect,
  BountiesWhereInput,
} from '@/prisma/models/Bounties';
import * as Database from '@/server/database';
import * as HomeChapters from '@/server/home-chapters';
import {
  type ChapterRegion,
  regionScope,
  regionsForUserLocation,
} from '@/server/home-regions';

import type { ListingCardData } from '@/features/home/types/cards';

// Earn's list parameters (features/listings/constants/schema.ts).
const CATEGORIES = [
  'For You',
  'All',
  'Content',
  'Design',
  'Development',
  'Other',
] as const;
const STATUSES = ['open', 'review', 'completed', 'all'] as const;
const SORTS = ['Date', 'Prize', 'Submissions', 'Status'] as const;
const CONTEXTS = [
  'home',
  'all',
  'region',
  'sponsor',
  'bookmarks',
  'category',
] as const;

export type ListCategory = (typeof CATEGORIES)[number];
export type ListStatus = (typeof STATUSES)[number];
export type ListSort = (typeof SORTS)[number];
export type ListContext = (typeof CONTEXTS)[number];
export type ListOrder = 'asc' | 'desc';

export const ListQuery = Schema.Struct({
  // 'all', 'bounties', or a hackathon's slug.
  tab: Schema.NonEmptyString,
  order: Schema.Literals(['asc', 'desc']),
  category: Schema.Literals(CATEGORIES),
  status: Schema.Literals(STATUSES),
  sortBy: Schema.Literals(SORTS),
  context: Schema.Literals(CONTEXTS),
  region: Schema.optional(Schema.String),
  sponsor: Schema.optional(Schema.String),
});
export type ListQuery = typeof ListQuery.Type;

export const LIST_DEFAULTS = {
  tab: 'all',
  order: 'asc',
  category: 'All',
  status: 'open',
  sortBy: 'Date',
  context: 'all',
} as const satisfies Omit<ListQuery, 'region' | 'sponsor'>;

type Params = Readonly<Record<string, string | undefined>>;

const orDefault = (params: Params) => {
  const pick = (key: keyof typeof LIST_DEFAULTS) =>
    params[key] === undefined || params[key] === ''
      ? LIST_DEFAULTS[key]
      : params[key];
  return {
    tab: pick('tab'),
    order: pick('order'),
    category: pick('category'),
    status: pick('status'),
    sortBy: pick('sortBy'),
    context: pick('context'),
    ...(params.region ? { region: params.region } : {}),
    ...(params.sponsor ? { sponsor: params.sponsor } : {}),
  };
};

// The route handler's parameters, as Earn's zod schema read them: missing
// ones take their defaults, anything else wrong is refused.
export const decodeListQuery = (params: Params): Option.Option<ListQuery> =>
  Schema.decodeUnknownOption(ListQuery)(orDefault(params));

const oneOf = <A extends string>(
  value: string | undefined,
  allowed: ReadonlyArray<A>,
  fallback: A,
): A => allowed.find((item) => item === value) ?? fallback;

// A page's search params, as Earn's useListingState read them: each one
// that isn't valid falls back to `defaults`.
export function pageListQuery(
  params: Params,
  defaults: Omit<ListQuery, 'context' | 'region' | 'sponsor'>,
): Omit<ListQuery, 'context' | 'region' | 'sponsor'> {
  return {
    tab: params.tab || defaults.tab,
    order: oneOf(params.order, ['asc', 'desc'], defaults.order),
    category: oneOf(params.category, CATEGORIES, defaults.category),
    status: oneOf(params.status, STATUSES, defaults.status),
    sortBy: oneOf(params.sortBy, SORTS, defaults.sortBy),
  };
}

// Who's looking, as the list rules use them (Earn's route loaded these).
export interface ListViewer {
  readonly id: string;
  readonly isTalentFilled: boolean;
  readonly location: string | null;
  readonly skills: unknown;
}

// What a list card shows (Earn's listingSelect).
const LISTING_CARD = {
  id: true,
  rewardAmount: true,
  deadline: true,
  type: true,
  title: true,
  token: true,
  winnersAnnouncedAt: true,
  slug: true,
  isWinnersAnnounced: true,
  isFeatured: true,
  compensationType: true,
  minRewardAsk: true,
  maxRewardAsk: true,
  status: true,
  _count: {
    select: {
      Comments: {
        where: {
          isActive: true,
          isArchived: false,
          replyToId: null,
          type: { not: 'SUBMISSION' },
        },
      },
      Submission: true,
    },
  },
  sponsor: {
    select: {
      name: true,
      slug: true,
      logo: true,
      isVerified: true,
      chapter: { select: { id: true } },
    },
  },
} as const satisfies BountiesSelect;

const SKILLS_OF: Record<string, ReadonlyArray<string>> = {
  Development: ['Frontend', 'Backend', 'Blockchain', 'Mobile'],
  Design: ['Design'],
  Content: ['Content'],
  Other: ['Other', 'Growth', 'Community'],
};

function skillFilter(category: ListCategory): BountiesWhereInput | null {
  if (category === 'All' || category === 'For You') return null;
  const skills = SKILLS_OF[category] ?? [];
  if (skills.length === 0) return null;
  if (category === 'Development' || category === 'Other') {
    return {
      OR: skills.map((skill) => ({
        skills: { path: '$[*].skills', array_contains: [skill] },
      })),
    };
  }
  return { skills: { path: '$[*].skills', array_contains: [...skills] } };
}

function statusFilter(
  status: ListStatus,
  now: Date,
): BountiesWhereInput | null {
  switch (status) {
    case 'open':
      return {
        isWinnersAnnounced: false,
        OR: [{ deadline: null }, { deadline: { gte: now } }],
      };
    case 'review':
      return { isWinnersAnnounced: false, deadline: { lt: now } };
    case 'completed':
      return { isWinnersAnnounced: true };
    default:
      return null;
  }
}

function orderBy(
  query: ListQuery,
): BountiesOrderByWithRelationInput | BountiesOrderByWithRelationInput[] {
  const { sortBy, order, status } = query;
  const opposite = order === 'asc' ? 'desc' : 'asc';
  let primary: BountiesOrderByWithRelationInput;
  switch (sortBy) {
    case 'Status':
      return [
        { isWinnersAnnounced: 'asc' },
        { deadline: { sort: 'desc', nulls: 'first' } },
      ];
    case 'Date':
      if (status === 'review') {
        primary = { deadline: { sort: opposite, nulls: 'last' } };
      } else if (status === 'completed') {
        primary = { winnersAnnouncedAt: { sort: opposite, nulls: 'last' } };
      } else {
        primary = { deadline: { sort: order, nulls: 'last' } };
      }
      break;
    case 'Prize':
      primary = { usdValue: { sort: order, nulls: 'last' } };
      break;
    case 'Submissions':
      primary = { Submission: { _count: order } };
      break;
  }
  // Featured first only for the default sort, on open or all listings.
  const isDefault =
    sortBy === 'Date' &&
    order === 'asc' &&
    (status === 'open' || status === 'all');
  return isDefault ? [{ isFeatured: 'desc' }, primary] : primary;
}

const skillNames = (skills: unknown): string[] =>
  Array.isArray(skills)
    ? skills.flatMap((item: unknown) =>
        typeof item === 'object' &&
        item !== null &&
        'skills' in item &&
        typeof item.skills === 'string'
          ? [item.skills]
          : [],
      )
    : [];

// Earn's buildListingQuery (features/listings/utils/query-builder.ts),
// pure: what a list shows, in what order, for whom.
export function listingQuery(
  query: ListQuery,
  viewer: ListViewer | null,
  chapters: ReadonlyArray<ChapterRegion>,
  hackathonSlugs: ReadonlyArray<string>,
  now: Date,
): {
  readonly where: BountiesWhereInput;
  readonly orderBy:
    | BountiesOrderByWithRelationInput
    | BountiesOrderByWithRelationInput[];
  readonly take?: number;
} {
  const { tab, category, status, context, region, sponsor } = query;
  const effectiveCategory =
    context === 'bookmarks' && category === 'For You' ? 'All' : category;

  const where: BountiesWhereInput = {
    isPublished: true,
    isActive: true,
    isArchived: false,
    isPrivate: false,
    hackathonprize: false,
  };
  const and: BountiesWhereInput[] = [];

  if (context === 'home') {
    and.push({
      language: { in: ['eng', 'sco'] },
      compensationType: 'fixed',
      usdValue: { gt: 100 },
    });
  }

  if (viewer?.isTalentFilled && (context === 'all' || context === 'home')) {
    where.region = { in: regionsForUserLocation(chapters, viewer.location) };
  }

  if (effectiveCategory === 'For You') {
    const forYou: BountiesWhereInput[] = [];
    if (viewer)
      forYou.push({ SubscribeBounty: { some: { userId: viewer.id } } });
    for (const skill of skillNames(viewer?.skills)) {
      forYou.push({ skills: { path: '$[*].skills', array_contains: [skill] } });
    }
    forYou.push({ isFeatured: true });
    and.push({ OR: forYou });
  }

  if (context === 'region' && region) {
    const scope = regionScope(chapters, region);
    and.push({
      OR:
        scope.kind === 'chapter'
          ? [
              { region: { in: scope.regions } },
              { sponsor: { name: scope.sponsorName } },
            ]
          : [{ region: { in: scope.regions } }],
    });
  }

  if (context === 'sponsor' && sponsor) {
    where.sponsor = { slug: sponsor.toLowerCase() };
  }

  if (context === 'bookmarks') {
    // Callers answer an empty list for signed-out visitors first.
    and.push({
      SubscribeBounty: {
        some: { userId: viewer?.id ?? '', isArchived: false },
      },
    });
  }

  if (tab === 'bounties') {
    where.type = 'bounty';
  } else if (tab === 'all') {
    where.OR = [{ type: 'bounty' }, { type: 'hackathon', isFeatured: true }];
  } else if (hackathonSlugs.includes(tab)) {
    where.type = 'hackathon';
    where.Hackathon = { slug: tab };
  }

  const byStatus = statusFilter(status, now);
  if (byStatus) and.push(byStatus);

  const bySkill = skillFilter(
    context === 'category' ? category : effectiveCategory,
  );
  if (bySkill) and.push(bySkill);

  if (and.length > 0) where.AND = and;

  return {
    where,
    orderBy: orderBy(query),
    ...(context === 'home' ? { take: 10 } : {}),
  };
}

// Featured listings still open go first, keeping the rest's order
// (Earn's reorderFeaturedOngoing).
export function featuredOngoingFirst<
  T extends {
    readonly isFeatured: boolean | null;
    readonly isWinnersAnnounced: boolean;
    readonly deadline: Date | null;
  },
>(listings: ReadonlyArray<T>, now: Date): T[] {
  const ongoing = (listing: T) =>
    !listing.isWinnersAnnounced &&
    (!listing.deadline || listing.deadline.getTime() >= now.getTime());
  return [
    ...listings.filter(
      (listing) => listing.isFeatured === true && ongoing(listing),
    ),
    ...listings.filter(
      (listing) => !(listing.isFeatured === true && ongoing(listing)),
    ),
  ];
}

export type ListingRow = ListingCardData & {
  readonly deadline: Date | null;
  readonly winnersAnnouncedAt: Date | null;
};

export class ViewerBlocked extends Schema.TaggedError<ViewerBlocked>()(
  'ViewerBlocked',
  {},
) {
  override get message() {
    return 'User is blocked';
  }
}

export class ListingLists extends Context.Service<
  ListingLists,
  {
    // The list viewer behind a session, or a blocked account's refusal.
    readonly viewer: (
      privyDid: string,
    ) => Effect.Effect<
      ListViewer | null,
      ViewerBlocked | Database.DatabaseError
    >;
    readonly list: (
      query: ListQuery,
      viewer: ListViewer | null,
    ) => Effect.Effect<ReadonlyArray<ListingRow>, Database.DatabaseError>;
    // How many each category pill would show (the query less its
    // category).
    readonly counts: (
      query: Omit<ListQuery, 'category'>,
      viewer: ListViewer | null,
    ) => Effect.Effect<Record<ListCategory, number>, Database.DatabaseError>;
    // The sponsor's newest live bounty's slug, if any (Earn's
    // /api/listings/latest-active-slug).
    readonly latestActiveSlug: (
      userId: string,
    ) => Effect.Effect<
      | { readonly kind: 'slug'; readonly slug: string }
      | { readonly kind: 'no-sponsor' }
      | { readonly kind: 'none' },
      Database.DatabaseError
    >;
  }
>()('earn/ListingLists') {}

// The hackathon tabs (features/hackathon/constants/hackathons.ts).
const HACKATHON_SLUGS = ['crypto-worlds-fair'];

const make = Effect.gen(function* () {
  const database = yield* Database.Database;
  const chapters = yield* HomeChapters.HomeChapters;

  const now = Clock.currentTimeMillis.pipe(Effect.map((ms) => new Date(ms)));

  const viewer = Effect.fn('ListingLists.viewer')(function* (privyDid: string) {
    const user = yield* database.query('listViewer', (client) =>
      client.user.findUnique({
        where: { privyDid },
        select: {
          id: true,
          isTalentFilled: true,
          location: true,
          skills: true,
          isBlocked: true,
        },
      }),
    );
    if (!user) return null;
    if (user.isBlocked) return yield* new ViewerBlocked();
    return {
      id: user.id,
      isTalentFilled: user.isTalentFilled,
      location: user.location,
      skills: user.skills,
    } satisfies ListViewer;
  });

  const list = Effect.fn('ListingLists.list')(function* (
    query: ListQuery,
    who: ListViewer | null,
  ) {
    if (query.context === 'bookmarks' && !who) return [];
    const at = yield* now;
    const {
      where,
      orderBy: order,
      take,
    } = listingQuery(query, who, yield* chapters.all, HACKATHON_SLUGS, at);
    const rows = yield* database.query('listings', (client) =>
      client.bounties.findMany({
        where,
        orderBy: order,
        take,
        select: LISTING_CARD,
      }),
    );
    return featuredOngoingFirst(rows, at);
  });

  const counts = Effect.fn('ListingLists.counts')(function* (
    query: Omit<ListQuery, 'category'>,
    who: ListViewer | null,
  ) {
    const result: Record<ListCategory, number> = {
      'For You': 0,
      All: 0,
      Content: 0,
      Design: 0,
      Development: 0,
      Other: 0,
    };
    if (query.context === 'bookmarks' && !who) return result;
    const at = yield* now;
    const all = yield* chapters.all;
    const tallies = yield* Effect.forEach(
      CATEGORIES,
      (category) =>
        database
          .query('listingCount', (client) =>
            client.bounties.count({
              where: listingQuery(
                { ...query, category },
                who,
                all,
                HACKATHON_SLUGS,
                at,
              ).where,
            }),
          )
          .pipe(
            // As Earn: a category that fails to count shows 0.
            Effect.orElseSucceed(() => 0),
            Effect.map((count) => [category, count] as const),
          ),
      { concurrency: 'unbounded' },
    );
    for (const [category, count] of tallies) result[category] = count;
    return result;
  });

  const latestActiveSlug = Effect.fn('ListingLists.latestActiveSlug')(
    function* (userId: string) {
      const user = yield* database.query('latestActiveSponsor', (client) =>
        client.user.findUnique({
          where: { id: userId },
          select: { currentSponsorId: true },
        }),
      );
      if (!user?.currentSponsorId) return { kind: 'no-sponsor' } as const;
      const sponsorId = user.currentSponsorId;
      const at = yield* now;
      const row = yield* database.query('latestActiveSlug', (client) =>
        client.bounties.findFirst({
          select: { slug: true },
          where: {
            sponsorId,
            isPublished: true,
            isWinnersAnnounced: false,
            deadline: { gt: at },
            sponsor: { isVerified: true },
          },
          orderBy: [{ createdAt: 'desc' }],
        }),
      );
      return row?.slug
        ? ({ kind: 'slug', slug: row.slug } as const)
        : ({ kind: 'none' } as const);
    },
  );

  return ListingLists.of({ viewer, list, counts, latestActiveSlug });
});

export const layer = Layer.effect(ListingLists, make);
