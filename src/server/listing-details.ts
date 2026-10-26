import 'server-only';

import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';

import { exclusiveSponsorData } from '@/constants/exclusiveSponsors';
import type { ChapterRegionData } from '@/interface/chapter';
import type { ParentSkills, Skills, SubSkillsType } from '@/interface/skills';
import type {
  ListingPageSubmission,
  ListingWinner,
} from '@/interface/submission';
import type { BountyType } from '@/prisma/enums';
import { empty, join, raw, sql } from '@/prisma/internal/prismaNamespace';
import * as Database from '@/server/database';
import { chapterRegions, regionForLocation } from '@/server/listing-regions';

import type { ListingCardData } from '@/features/home/types/cards';
import { publicListingDetailsSelect } from '@/features/listings/constants/publicListingDetails';
import { listingSelect } from '@/features/listings/constants/schema';
import type { PublicListingDetails } from '@/features/listings/types';
import {
  filterRegionCountry,
  getCombinedRegion,
  getParentRegions,
} from '@/features/listings/utils/region';

// Who may see unpublished listings by link (`?preview=1`): Earn's GOD role
// sees them all, a sponsor's members their sponsors'.
export interface PreviewAccess {
  readonly all: boolean;
  readonly sponsorIds: ReadonlyArray<string>;
}

// What the sidebar's related list goes by.
export interface SidebarListing {
  readonly id: string;
  readonly sponsorId?: string | null;
  readonly hackathonId?: string | null;
  readonly sponsor?: { readonly name?: string | null } | null;
}

export const NO_PREVIEW: PreviewAccess = { all: false, sponsorIds: [] };

// The signed-in person's own entry, as Earn's /api/submission/check answers
// (the winner fields only once winners are announced), plus what the
// submission form needs to edit it (Earn's /api/submission/get).
export interface ViewerEntry {
  readonly isSubmitted: boolean;
  readonly status: string | null;
  readonly id?: string;
  readonly isWinner?: boolean;
  readonly isKYCVerified?: boolean;
  readonly kycVerifiedAt?: string;
  readonly isPaid?: boolean;
  readonly winnerPosition?: number;
  readonly paymentSynced?: boolean;
  readonly kycCountry?: string | null;
  readonly listingRegion?: string | null;
  readonly form?: {
    readonly link: string;
    readonly tweet: string;
    readonly otherInfo: string;
    readonly eligibilityAnswers: unknown;
  };
}

// What a page hands its client components is plain JSON: dates as ISO
// strings, as Earn's API answered.
// The caller names the JSON's shape.
// oxlint-disable-next-line typescript/no-unnecessary-type-parameters
function toJson<A>(value: unknown): A {
  const text = JSON.stringify(value, (_, item: unknown) =>
    typeof item === 'bigint' ? item.toString() : item,
  );
  // Earn's own shapes, defined by the selects above them.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return (text === undefined ? null : JSON.parse(text)) as A;
}

const DEV_SKILLS = ['Frontend', 'Backend', 'Blockchain', 'Mobile'];
const RELATED_LIMIT = 5;

export class ListingDetails extends Context.Service<
  ListingDetails,
  {
    // Who may preview unpublished listings, by their Earn user id. A blocked
    // account previews nothing.
    readonly previewAccess: (
      userId: string,
    ) => Effect.Effect<PreviewAccess, Database.DatabaseError>;
    // A live listing by slug, as Earn's listing page loads it (published,
    // or unpublished for those who may preview it).
    readonly bySlug: (
      slug: string,
      access?: PreviewAccess,
    ) => Effect.Effect<
      Option.Option<PublicListingDetails>,
      Database.DatabaseError
    >;
    readonly submissionCount: (
      listingId: string,
    ) => Effect.Effect<number, Database.DatabaseError>;
    // Announced winners, by position.
    readonly winners: (
      listingId: string,
    ) => Effect.Effect<Array<ListingWinner>, Database.DatabaseError>;
    // The Submissions tab: a published listing and, once winners are out,
    // every submission (winners first, by position, then newest).
    readonly submissionsTab: (slug: string) => Effect.Effect<
      {
        readonly bounty: PublicListingDetails | null;
        readonly submission: Array<ListingPageSubmission>;
      },
      Database.DatabaseError
    >;
    // Live listings like this one (Earn's /api/listings/[id]/related), for
    // someone in `location`.
    readonly related: (
      listingId: string,
      location: string | null,
      take?: number,
    ) => Effect.Effect<Array<ListingCardData>, Database.DatabaseError>;
    // The listing page's sidebar: related listings, topped up with live
    // ones closing soonest, five in all.
    readonly sidebar: (
      listing: SidebarListing,
      location: string | null,
    ) => Effect.Effect<Array<ListingCardData>, Database.DatabaseError>;
    readonly chapters: Effect.Effect<
      Array<ChapterRegionData>,
      Database.DatabaseError
    >;
    readonly viewerEntry: (
      userId: string,
      listingId: string,
    ) => Effect.Effect<ViewerEntry, Database.DatabaseError>;
    // An unpublished listing's card details for its preview image.
    readonly ogPreview: (slug: string) => Effect.Effect<
      Option.Option<{
        readonly title: string;
        readonly rewardAmount: number | null;
        readonly token: string | null;
        readonly type: string;
        readonly compensationType: string;
        readonly minRewardAsk: number | null;
        readonly maxRewardAsk: number | null;
        readonly sponsor: {
          readonly name: string;
          readonly logo: string | null;
          readonly isVerified: boolean;
        };
      }>,
      Database.DatabaseError
    >;
    // A token's icon (inactive ones too), as Earn's getTokenIcon finds it.
    readonly tokenIcon: (
      symbol: string | null,
    ) => Effect.Effect<string | null, Database.DatabaseError>;
  }
>()('earn/ListingDetails') {}

const sortWinners = <A extends { readonly winnerPosition: number | null }>(
  rows: Array<A>,
) =>
  rows.toSorted((a, b) => {
    if (!a.winnerPosition) return 1;
    if (!b.winnerPosition) return -1;
    return a.winnerPosition - b.winnerPosition;
  });

const sortSubmissions = (
  a: { readonly winnerPosition: number | null; readonly createdAt: Date },
  b: { readonly winnerPosition: number | null; readonly createdAt: Date },
) => {
  if (a.winnerPosition && b.winnerPosition) {
    return (
      (a.winnerPosition || Number.MAX_VALUE) -
      (b.winnerPosition || Number.MAX_VALUE)
    );
  }
  if (a.winnerPosition && !b.winnerPosition) return -1;
  if (!a.winnerPosition && b.winnerPosition) return 1;
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

// A raw related row as the cards read it: MySQL hands back JSON_OBJECT as
// text and booleans as 0/1 (a bare 0 would render on the card).
const relatedCard = (row: unknown): unknown => {
  if (!isRecord(row)) return row;
  const sponsor: unknown =
    typeof row.sponsor === 'string' ? JSON.parse(row.sponsor) : row.sponsor;
  return {
    ...row,
    isWinnersAnnounced: Boolean(row.isWinnersAnnounced),
    isFeatured: Boolean(row.isFeatured),
    sponsor: isRecord(sponsor)
      ? { ...sponsor, isVerified: Boolean(sponsor.isVerified) }
      : sponsor,
  };
};

const TOKEN_ICON_PROXY_PATH = '/api/token-icon';

const make = Effect.gen(function* () {
  const database = yield* Database.Database;
  const chapters = chapterRegions(database);

  const previewAccess = Effect.fn('ListingDetails.previewAccess')(function* (
    userId: string,
  ) {
    const user = yield* database.query('previewUser', (client) =>
      client.user.findUnique({
        where: { id: userId },
        select: {
          isBlocked: true,
          role: true,
          UserSponsors: { select: { sponsorId: true } },
        },
      }),
    );
    if (!user || user.isBlocked) return NO_PREVIEW;
    return {
      all: user.role === 'GOD',
      sponsorIds: user.UserSponsors.map(({ sponsorId }) => sponsorId),
    } satisfies PreviewAccess;
  });

  const bySlug = Effect.fn('ListingDetails.bySlug')(function* (
    slug: string,
    access: PreviewAccess = NO_PREVIEW,
  ) {
    if (!slug) return Option.none();
    const row = yield* database.query('listingBySlug', (client) =>
      client.bounties.findFirst({
        where: {
          slug,
          isActive: true,
          isArchived: false,
          ...(access.all
            ? {}
            : access.sponsorIds.length > 0
              ? {
                  OR: [
                    { isPublished: true },
                    { sponsorId: { in: [...access.sponsorIds] } },
                  ],
                }
              : { isPublished: true }),
        },
        select: publicListingDetailsSelect,
      }),
    );
    return Option.fromNullishOr(toJson<PublicListingDetails | null>(row));
  });

  const submissionCount = Effect.fn('ListingDetails.submissionCount')(
    function* (listingId: string) {
      const result = yield* database.query('submissionCount', (client) =>
        client.submission.aggregate({
          _count: true,
          where: { listingId, isActive: true, isArchived: false },
        }),
      );
      return result._count || 0;
    },
  );

  const winners = Effect.fn('ListingDetails.winners')(function* (
    listingId: string,
  ) {
    if (!listingId) return [];
    const rows = yield* database.query('listingWinners', (client) =>
      client.submission.findMany({
        where: {
          listingId,
          isActive: true,
          isArchived: false,
          isWinner: true,
          listing: { isWinnersAnnounced: true },
        },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          winnerPosition: true,
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              photo: true,
            },
          },
        },
      }),
    );
    return sortWinners(rows) satisfies Array<ListingWinner>;
  });

  const submissionsTab = Effect.fn('ListingDetails.submissionsTab')(function* (
    slug: string,
  ) {
    const bounty = yield* database.query('submissionsListing', (client) =>
      client.bounties.findFirst({
        where: { slug, isActive: true, isPublished: true, isArchived: false },
        select: publicListingDetailsSelect,
      }),
    );
    if (!bounty) return { bounty: null, submission: [] };
    const publicBounty = toJson<PublicListingDetails>(bounty);
    if (!bounty.isWinnersAnnounced) {
      return { bounty: publicBounty, submission: [] };
    }
    const rows = yield* database.query('listingSubmissions', (client) =>
      client.submission.findMany({
        // Deleted entries stay off the public tab (Earn showed them).
        where: { listingId: bounty.id, isActive: true, isArchived: false },
        select: {
          id: true,
          link: true,
          isWinner: true,
          winnerPosition: true,
          like: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              photo: true,
              username: true,
            },
          },
        },
      }),
    );
    rows.sort(sortSubmissions);
    const submission = rows.map(
      ({ createdAt: _, ...item }): ListingPageSubmission => ({
        ...item,
        link: item.link ?? undefined,
        winnerPosition: item.winnerPosition ?? undefined,
        like: item.like ?? undefined,
        user: {
          id: item.user.id,
          firstName: item.user.firstName ?? undefined,
          lastName: item.user.lastName ?? undefined,
          photo: item.user.photo ?? undefined,
          username: item.user.username ?? undefined,
        },
      }),
    );
    return {
      bounty: publicBounty,
      submission: toJson<Array<ListingPageSubmission>>(submission),
    };
  });

  const relatedRows = (
    listingId: string,
    skills: Array<SubSkillsType | ParentSkills>,
    take: number,
    isDevListing: boolean,
    type: BountyType,
    userRegion: string | undefined,
  ) => {
    const skillField = isDevListing ? 'subskills' : 'skills';
    const matchingField = isDevListing ? 'matchingSubskills' : 'matchingSkills';
    const skillQuery =
      skills.length > 0
        ? sql`(${join(
            skills.map(
              (skill) =>
                sql`JSON_CONTAINS(JSON_EXTRACT(skills, '$[*].${raw(skillField)}'), JSON_QUOTE(${skill}))`,
            ),
            ' OR ',
          )})`
        : sql`TRUE`;
    const regionFilter = userRegion
      ? sql`AND (region = ${userRegion} OR region = 'Global')`
      : empty;
    return database.query(
      'relatedListings',
      (client) => client.$queryRaw<Array<unknown>>`
        SELECT
          b.id,
          b.rewardAmount,
          b.deadline,
          b.type,
          b.title,
          b.token,
          b.winnersAnnouncedAt,
          b.slug,
          b.isWinnersAnnounced,
          b.isFeatured,
          b.compensationType,
          b.minRewardAsk,
          b.maxRewardAsk,
          b.status,
          (
            SELECT COUNT(*)
            FROM Comment c
            WHERE c.refId = b.id
              AND c.isActive = true
              AND c.isArchived = false
              AND c.replyToId IS NULL
              AND c.type != 'SUBMISSION'
          ) as _count_Comments,
          JSON_OBJECT(
            'name', s.name,
            'slug', s.slug,
            'logo', s.logo,
            'isVerified', s.isVerified
          ) as sponsor,
          SUM(
            CASE
              WHEN ${skillQuery} THEN 1
              ELSE 0
            END
          ) as ${raw(matchingField)}
        FROM Bounties b
        LEFT JOIN Sponsors s ON b.sponsorId = s.id
        WHERE b.id != ${listingId}
          AND b.isPrivate = false
          AND b.isPublished = true
          AND b.isActive = true
          AND b.status = 'OPEN'
          AND b.isWinnersAnnounced = false
          AND b.deadline > NOW()
          AND b.type = ${type}
          ${regionFilter}
          AND ${skillQuery}
        GROUP BY b.id
        ORDER BY b.deadline ASC, ${raw(matchingField)} DESC
        LIMIT ${take}
      `,
    );
  };

  const related = Effect.fn('ListingDetails.related')(function* (
    listingId: string,
    location: string | null,
    take = RELATED_LIMIT,
  ) {
    const [listing, regions] = yield* Effect.all(
      [
        database.query('relatedOf', (client) =>
          client.bounties.findUnique({
            where: { id: listingId },
            select: { skills: true, type: true },
          }),
        ),
        location ? chapters : Effect.succeed(null),
      ],
      { concurrency: 'unbounded' },
    );
    if (!listing) return [];
    // Earn's JSON column of skills.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    const skills = (listing.skills as Skills | null) ?? [];
    if (skills.length === 0) return [];
    const userRegion = regions
      ? regionForLocation(location, regions)
      : undefined;
    const isDevListing = skills.some((skill) =>
      DEV_SKILLS.includes(skill.skills),
    );
    const rows = yield* relatedRows(
      listingId,
      isDevListing
        ? skills.flatMap((skill) => skill.subskills)
        : skills.map((skill) => skill.skills),
      take,
      isDevListing,
      listing.type,
      userRegion,
    );
    return toJson<Array<ListingCardData>>(rows.map(relatedCard));
  });

  // Earn's /api/listings/live, as the related list tops itself up.
  const live = (
    listing: SidebarListing,
    location: string | null,
    regions: ReadonlyArray<ChapterRegionData>,
    take: number,
    excludeIds: ReadonlyArray<string>,
  ) => {
    const isExclusive = Object.values(exclusiveSponsorData).some(
      (sponsor) => sponsor.title === listing.sponsor?.name,
    );
    const userRegion = location
      ? getCombinedRegion(location, true, [...regions])
      : undefined;
    const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return database.query('liveListings', (client) =>
      client.bounties.findMany({
        where: {
          id: { notIn: [...excludeIds] },
          isPublished: true,
          isActive: true,
          isPrivate: false,
          isArchived: false,
          status: 'OPEN',
          deadline: { gte: deadline },
          type: listing.hackathonId ? 'hackathon' : 'bounty',
          region: {
            in: userRegion?.name
              ? [
                  'Global',
                  userRegion.name,
                  ...(filterRegionCountry(userRegion, location || '').country ||
                    []),
                  ...(getParentRegions(userRegion) || []),
                ]
              : ['Global'],
          },
          sponsorId: isExclusive ? (listing.sponsorId ?? undefined) : undefined,
        },
        select: listingSelect,
        take,
        orderBy: [{ deadline: 'asc' }, { winnersAnnouncedAt: 'desc' }],
      }),
    );
  };

  const sidebar = Effect.fn('ListingDetails.sidebar')(function* (
    listing: SidebarListing,
    location: string | null,
  ) {
    const [relatedListings, regions] = yield* Effect.all(
      [related(listing.id, location), chapters],
      { concurrency: 'unbounded' },
    );
    if (relatedListings.length >= RELATED_LIMIT) {
      return relatedListings.slice(0, RELATED_LIMIT);
    }
    const liveListings = toJson<Array<ListingCardData>>(
      yield* live(listing, location, regions, RELATED_LIMIT, [listing.id]),
    );
    const relatedIds = new Set(relatedListings.map((item) => item.id));
    return [
      ...relatedListings,
      ...liveListings
        .filter((item) => !relatedIds.has(item.id))
        .slice(0, RELATED_LIMIT - relatedListings.length),
    ];
  });

  const viewerEntry = Effect.fn('ListingDetails.viewerEntry')(function* (
    userId: string,
    listingId: string,
  ) {
    const submission = yield* database.query('viewerSubmission', (client) =>
      client.submission.findFirst({
        where: { listingId, userId, isActive: true, isArchived: false },
        select: {
          id: true,
          status: true,
          isWinner: true,
          isPaid: true,
          winnerPosition: true,
          paymentSynced: true,
          link: true,
          tweet: true,
          otherInfo: true,
          eligibilityAnswers: true,
          listing: { select: { isWinnersAnnounced: true, region: true } },
          user: {
            select: {
              isKYCVerified: true,
              kycVerifiedAt: true,
              kycCountry: true,
            },
          },
        },
      }),
    );
    if (!submission) return { isSubmitted: false, status: null };
    const entry: ViewerEntry = {
      isSubmitted: true,
      status: submission.status,
      id: submission.id,
      form: {
        link: submission.link ?? '',
        tweet: submission.tweet ?? '',
        otherInfo: submission.otherInfo ?? '',
        eligibilityAnswers: submission.eligibilityAnswers,
      },
    };
    if (!submission.listing.isWinnersAnnounced) return entry;
    return {
      ...entry,
      isWinner: submission.isWinner,
      isKYCVerified: submission.user.isKYCVerified,
      isPaid: submission.isPaid,
      winnerPosition: submission.winnerPosition ?? undefined,
      paymentSynced: submission.paymentSynced,
      kycVerifiedAt: submission.user.kycVerifiedAt?.toISOString(),
      kycCountry: submission.user.kycCountry ?? undefined,
      listingRegion: submission.listing.region ?? undefined,
    } satisfies ViewerEntry;
  });

  const ogPreview = Effect.fn('ListingDetails.ogPreview')(function* (
    slug: string,
  ) {
    const row = yield* database.query('ogPreview', (client) =>
      client.bounties.findFirst({
        where: { slug, isPublished: false, isActive: true, isArchived: false },
        select: {
          title: true,
          rewardAmount: true,
          token: true,
          type: true,
          compensationType: true,
          minRewardAsk: true,
          maxRewardAsk: true,
          sponsor: { select: { name: true, logo: true, isVerified: true } },
        },
      }),
    );
    return Option.fromNullishOr(row);
  });

  const tokenIcon = Effect.fn('ListingDetails.tokenIcon')(function* (
    symbol: string | null,
  ) {
    const wanted = symbol;
    if (!wanted) return null;
    const token = yield* database.query('tokenIcon', (client) =>
      client.tokenMetadata.findFirst({
        where: { tokenSymbol: wanted },
        select: { icon: true },
      }),
    );
    const icon = token?.icon;
    if (!icon || !icon.startsWith(`${TOKEN_ICON_PROXY_PATH}?`)) {
      return icon ?? null;
    }
    const proxyUrl = new URL(icon, 'https://superteam.fun');
    proxyUrl.searchParams.set('format', 'png');
    return `${proxyUrl.pathname}${proxyUrl.search}`;
  });

  return ListingDetails.of({
    previewAccess,
    bySlug,
    submissionCount,
    winners,
    submissionsTab,
    related,
    sidebar,
    chapters,
    viewerEntry,
    ogPreview,
    tokenIcon,
  });
});

export const layer = Layer.effect(ListingDetails, make);
