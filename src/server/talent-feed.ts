import 'server-only';

import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import * as Database from '@/server/database';
import * as ImageStore from '@/server/image-store';

import type { FeedDataProps, FeedPostType } from '@/features/feed/types';

// What the activity feed and a talent's profile ask for: Earn's
// /api/feed/get query, already bounded.
export interface FeedQuery {
  readonly filter?: 'new' | 'popular';
  readonly timePeriod?: string;
  readonly isWinner?: boolean;
  readonly take: number;
  readonly skip: number;
  // A talent's profile: only their activity.
  readonly userId?: string;
  readonly highlightId?: string;
  readonly highlightType?: FeedPostType;
  readonly takeOnlyType?: FeedPostType;
}

// One feed card, JSON-safe, in the shape Earn's feed cards read.
export type FeedItem = FeedDataProps;

export class TalentFeed extends Context.Service<
  TalentFeed,
  {
    // Submissions, personal projects and grant wins, newest (or most liked)
    // first. `privyDid` is whoever is asking: on their own profile they see
    // their private and unannounced work too.
    readonly list: (
      query: FeedQuery,
      privyDid: string | null,
    ) => Effect.Effect<ReadonlyArray<FeedItem>, Database.DatabaseError>;
    // One post and, for a submission, the others on its listing. null when
    // there's no such post.
    readonly post: (
      type: FeedPostType,
      id: string,
    ) => Effect.Effect<ReadonlyArray<FeedItem> | null, Database.DatabaseError>;
  }
>()('earn/TalentFeed') {}

const DAY_MS = 24 * 60 * 60 * 1000;

// Earn's time filters, in days back from now.
const PERIODS: Record<string, number> = {
  'this week': 7,
  'this month': 30,
  'this year': 365,
};

const COMMENTS_WHERE = {
  isActive: true,
  isArchived: false,
  replyToId: null,
} as const;

const RECENT_COMMENTS = {
  where: COMMENTS_WHERE,
  orderBy: { createdAt: 'desc' },
  take: 3,
  select: { author: { select: { photo: true, firstName: true } } },
} as const;

const COMMENT_COUNT = {
  select: { Comments: { where: COMMENTS_WHERE } },
} as const;

const AUTHOR = {
  select: {
    id: true,
    firstName: true,
    lastName: true,
    photo: true,
    username: true,
  },
} as const;

const SPONSOR = { select: { name: true, logo: true, slug: true } } as const;

const SUBMISSION_INCLUDE = {
  user: AUTHOR,
  listing: {
    select: {
      id: true,
      title: true,
      rewards: true,
      type: true,
      slug: true,
      isWinnersAnnounced: true,
      token: true,
      sponsor: SPONSOR,
      winnersAnnouncedAt: true,
      isPrivate: true,
    },
  },
  Comments: RECENT_COMMENTS,
  _count: COMMENT_COUNT,
} as const;

const POW_INCLUDE = {
  user: AUTHOR,
  Comments: RECENT_COMMENTS,
  _count: COMMENT_COUNT,
} as const;

const GRANT_APPLICATION_INCLUDE = {
  user: AUTHOR,
  grant: {
    select: {
      id: true,
      title: true,
      slug: true,
      token: true,
      isPrivate: true,
      sponsor: SPONSOR,
    },
  },
  Comments: RECENT_COMMENTS,
  _count: COMMENT_COUNT,
} as const;

const DECIDED = [
  { applicationStatus: 'Approved' as const },
  { applicationStatus: 'Completed' as const },
];

const iso = (date: Date) => date.toISOString();

// The cards read Earn's JSON as it arrived over the wire; these values
// are exactly that JSON, typed loosely where Earn's interface is loose.
// oxlint-disable-next-line typescript/no-unsafe-type-assertion
const asItem = (value: Record<string, unknown>) => value as unknown as FeedItem;

const make = Effect.gen(function* () {
  const database = yield* Database.Database;
  const images = yield* ImageStore.ImageStore;

  const list = Effect.fn('TalentFeed.list')(function* (
    query: FeedQuery,
    privyDid: string | null,
  ) {
    const { filter, isWinner, take, skip, userId, takeOnlyType } = query;
    const highlightType = query.highlightType;
    const highlightId = skip !== 0 ? undefined : query.highlightId;
    const profileUserId = userId ?? null;

    const viewer = privyDid
      ? yield* database.query('feedViewer', (client) =>
          client.user.findUnique({
            where: { privyDid },
            select: { id: true },
          }),
        )
      : null;
    const isOwnerProfile =
      profileUserId !== null && viewer?.id === profileUserId;

    const now = yield* Clock.currentTimeMillis;
    const days = query.timePeriod ? PERIODS[query.timePeriod] : undefined;
    const startDate = days ? new Date(now - days * DAY_MS) : undefined;
    const endDate = new Date(now);
    const inPeriod = {
      ...(startDate ? { gte: startDate } : {}),
      lte: endDate,
    };

    const winnerFilter = isWinner
      ? {
          AND: [{ isWinner: true }, { listing: { isWinnersAnnounced: true } }],
        }
      : {};
    const profileFilter = profileUserId ? { userId: profileUserId } : {};

    const submissions =
      !takeOnlyType || takeOnlyType === 'submission'
        ? yield* database.query('feedSubmissions', (client) =>
            client.submission.findMany({
              where: {
                createdAt: inPeriod,
                ...winnerFilter,
                ...profileFilter,
                listing: profileUserId ? {} : { isPrivate: false },
              },
              skip,
              take,
              orderBy:
                highlightType === 'submission'
                  ? [
                      { winnerPosition: 'asc' },
                      { likeCount: 'desc' },
                      { createdAt: 'desc' },
                    ]
                  : filter === 'popular'
                    ? [
                        { likeCount: 'desc' },
                        { listing: { winnersAnnouncedAt: 'desc' } },
                        { createdAt: 'desc' },
                      ]
                    : [{ createdAt: 'desc' }],
              include: SUBMISSION_INCLUDE,
            }),
          )
        : [];
    if (
      highlightId &&
      highlightType === 'submission' &&
      !submissions.some((submission) => submission.id === highlightId)
    ) {
      const highlighted = yield* database.query(
        'feedHighlightedSubmission',
        (client) =>
          client.submission.findFirst({
            where: { id: highlightId, ...profileFilter },
            include: SUBMISSION_INCLUDE,
          }),
      );
      if (highlighted) submissions.unshift(highlighted);
    }

    const pows =
      !isWinner && (!takeOnlyType || takeOnlyType === 'pow')
        ? yield* database.query('feedPows', (client) =>
            client.poW.findMany({
              where: { createdAt: inPeriod, ...profileFilter },
              skip,
              take,
              orderBy:
                filter === 'popular'
                  ? [{ likeCount: 'desc' }, { createdAt: 'desc' }]
                  : { createdAt: 'desc' },
              include: POW_INCLUDE,
            }),
          )
        : [];
    if (
      highlightId &&
      highlightType === 'pow' &&
      !pows.some((pow) => pow.id === highlightId)
    ) {
      const highlighted = yield* database.query(
        'feedHighlightedPow',
        (client) =>
          client.poW.findUnique({
            where: { id: highlightId, ...profileFilter },
            include: POW_INCLUDE,
          }),
      );
      if (highlighted) pows.unshift(highlighted);
    }

    const grantApplications =
      !takeOnlyType || takeOnlyType === 'grant-application'
        ? yield* database.query('feedGrantApplications', (client) =>
            client.grantApplication.findMany({
              where: {
                OR: DECIDED,
                decidedAt: inPeriod,
                ...profileFilter,
                grant: profileUserId ? {} : { isPrivate: false },
              },
              skip,
              take,
              orderBy:
                filter === 'popular'
                  ? [{ likeCount: 'desc' }, { decidedAt: 'desc' }]
                  : { decidedAt: 'desc' },
              include: GRANT_APPLICATION_INCLUDE,
            }),
          )
        : [];
    if (
      highlightId &&
      highlightType === 'grant-application' &&
      !grantApplications.some((application) => application.id === highlightId)
    ) {
      const highlighted = yield* database.query(
        'feedHighlightedGrantApplication',
        (client) =>
          client.grantApplication.findUnique({
            where: { id: highlightId, ...profileFilter, OR: DECIDED },
            include: GRANT_APPLICATION_INCLUDE,
          }),
      );
      if (highlighted) grantApplications.unshift(highlighted);
    }

    const results = [
      ...submissions.map((sub) => {
        const listing = sub.listing;
        const open =
          isOwnerProfile || (listing.isWinnersAnnounced && !listing.isPrivate);
        const shown = isOwnerProfile || !listing.isPrivate;
        return {
          at:
            sub.isWinner &&
            listing.isWinnersAnnounced &&
            listing.winnersAnnouncedAt
              ? listing.winnersAnnouncedAt
              : sub.createdAt,
          likeCount: sub.likeCount,
          item: {
            firstName: sub.user.firstName,
            lastName: sub.user.lastName,
            photo: sub.user.photo,
            username: sub.user.username,
            userId: sub.userId,
            id: open ? sub.id : null,
            link: open ? sub.link : null,
            tweet: open ? sub.tweet : null,
            otherInfo: open ? sub.otherInfo : null,
            isWinner: listing.isWinnersAnnounced ? sub.isWinner : null,
            winnerPosition: listing.isWinnersAnnounced
              ? sub.winnerPosition
              : null,
            listingId: shown ? listing.id : null,
            listingTitle: shown ? listing.title : null,
            rewards: listing.rewards,
            listingType: listing.type,
            listingSlug: shown ? listing.slug : null,
            isWinnersAnnounced: listing.isWinnersAnnounced,
            token: listing.token,
            sponsorName: shown ? listing.sponsor.name : null,
            sponsorLogo: shown ? listing.sponsor.logo : null,
            sponsorSlug: shown ? listing.sponsor.slug : null,
            type: 'submission',
            like: sub.like,
            likeCount: sub.likeCount,
            ogImage: !listing.isPrivate ? images.fetchUrl(sub.ogImage) : null,
            commentCount: sub._count.Comments,
            recentCommenters: sub.Comments,
            isPrivate: isOwnerProfile ? false : listing.isPrivate,
          },
        };
      }),
      ...pows.map((pow) => ({
        at: pow.createdAt,
        likeCount: pow.likeCount,
        item: {
          id: pow.id,
          description: pow.description,
          title: pow.title,
          userId: pow.user.id,
          firstName: pow.user.firstName,
          lastName: pow.user.lastName,
          photo: pow.user.photo,
          username: pow.user.username,
          type: 'pow',
          link: pow.link,
          like: pow.like,
          likeCount: pow.likeCount,
          ogImage: images.fetchUrl(pow.ogImage),
          commentCount: pow._count.Comments,
          recentCommenters: pow.Comments,
        },
      })),
      ...grantApplications.map((ga) => {
        const shown = isOwnerProfile || !ga.grant.isPrivate;
        return {
          at: ga.decidedAt ?? ga.createdAt,
          likeCount: ga.likeCount,
          item: {
            id: shown ? ga.id : null,
            userId: ga.userId,
            firstName: ga.user.firstName,
            lastName: ga.user.lastName,
            photo: ga.user.photo,
            username: ga.user.username,
            listingId: shown ? ga.grant.id : null,
            listingTitle: shown ? ga.grant.title : null,
            listingSlug: shown ? ga.grant.slug : null,
            token: ga.grant.token,
            sponsorName: shown ? ga.grant.sponsor.name : null,
            sponsorLogo: shown ? ga.grant.sponsor.logo : null,
            sponsorSlug: shown ? ga.grant.sponsor.slug : null,
            type: 'grant-application',
            grantApplicationAmount: ga.approvedAmount,
            like: ga.like,
            likeCount: ga.likeCount,
            commentCount: ga._count.Comments,
            recentCommenters: ga.Comments,
            isPrivate: isOwnerProfile ? false : ga.grant.isPrivate,
          },
        };
      }),
    ];

    results.sort((a, b) => {
      if (a.item.id === highlightId) return -1;
      if (b.item.id === highlightId) return 1;
      if (filter === 'popular' && a.likeCount !== b.likeCount) {
        return b.likeCount - a.likeCount;
      }
      return b.at.getTime() - a.at.getTime();
    });

    return results.map(({ at, item }) =>
      asItem({ ...item, createdAt: iso(at) }),
    );
  });

  const post = Effect.fn('TalentFeed.post')(function* (
    type: FeedPostType,
    id: string,
  ) {
    let found: Array<{
      at: Date;
      likeCount: number;
      winnerPosition?: number | null;
      item: Record<string, unknown>;
    }> | null = null;

    switch (type) {
      case 'submission': {
        const submission = yield* database.query(
          'feedPostSubmission',
          (client) =>
            client.submission.findUnique({
              where: { id },
              include: SUBMISSION_INCLUDE,
            }),
        );
        if (!submission) break;
        const similar = yield* database.query('feedPostSimilar', (client) =>
          client.submission.findMany({
            where: { id: { not: id }, listingId: submission.listingId },
            include: SUBMISSION_INCLUDE,
          }),
        );
        found = [submission, ...similar].map((sub) => {
          const listing = sub.listing;
          const announced = listing.isWinnersAnnounced;
          return {
            at:
              sub.isWinner && announced && listing.winnersAnnouncedAt
                ? listing.winnersAnnouncedAt
                : sub.createdAt,
            likeCount: sub.likeCount,
            winnerPosition: announced ? sub.winnerPosition : null,
            item: {
              id: announced ? sub.id : null,
              link: announced ? sub.link : null,
              tweet: announced ? sub.tweet : null,
              otherInfo: announced ? sub.otherInfo : null,
              isWinner: announced ? sub.isWinner : null,
              winnerPosition: announced ? sub.winnerPosition : null,
              firstName: sub.user.firstName,
              lastName: sub.user.lastName,
              photo: sub.user.photo,
              username: sub.user.username,
              listingId: listing.id,
              listingTitle: listing.title,
              rewards: listing.rewards,
              listingType: listing.type,
              listingSlug: listing.slug,
              isWinnersAnnounced: announced,
              token: listing.token,
              sponsorName: listing.sponsor.name,
              sponsorLogo: listing.sponsor.logo,
              sponsorSlug: listing.sponsor.slug,
              type: 'submission',
              like: sub.like,
              likeCount: sub.likeCount,
              ogImage: images.fetchUrl(sub.ogImage),
              commentCount: sub._count.Comments,
              recentCommenters: sub.Comments,
            },
          };
        });
        break;
      }
      case 'pow': {
        const pow = yield* database.query('feedPostPow', (client) =>
          client.poW.findUnique({ where: { id }, include: POW_INCLUDE }),
        );
        if (!pow) break;
        found = [
          {
            at: pow.createdAt,
            likeCount: pow.likeCount,
            item: {
              id: pow.id,
              description: pow.description,
              title: pow.title,
              firstName: pow.user.firstName,
              lastName: pow.user.lastName,
              photo: pow.user.photo,
              username: pow.user.username,
              type: 'pow',
              link: pow.link,
              like: pow.like,
              likeCount: pow.likeCount,
              ogImage: images.fetchUrl(pow.ogImage),
              commentCount: pow._count.Comments,
              recentCommenters: pow.Comments,
            },
          },
        ];
        break;
      }
      case 'grant-application': {
        const ga = yield* database.query('feedPostGrantApplication', (client) =>
          client.grantApplication.findUnique({
            where: { id },
            include: GRANT_APPLICATION_INCLUDE,
          }),
        );
        if (!ga) break;
        found = [
          {
            at: ga.decidedAt ?? ga.createdAt,
            likeCount: ga.likeCount,
            item: {
              id: ga.id,
              firstName: ga.user.firstName,
              lastName: ga.user.lastName,
              photo: ga.user.photo,
              username: ga.user.username,
              listingId: ga.grant.id,
              listingTitle: ga.grant.title,
              listingSlug: ga.grant.slug,
              token: ga.grant.token,
              sponsorName: ga.grant.sponsor.name,
              sponsorLogo: ga.grant.sponsor.logo,
              sponsorSlug: ga.grant.sponsor.slug,
              type: 'grant-application',
              grantApplicationAmount: ga.approvedAmount,
              like: ga.like,
              likeCount: ga.likeCount,
              commentCount: ga._count.Comments,
              recentCommenters: ga.Comments,
            },
          },
        ];
        break;
      }
    }
    if (!found) return null;

    found.sort((a, b) => {
      if (a.item.id === id) return -1;
      if (b.item.id === id) return 1;
      if (type === 'submission') {
        const pa = a.winnerPosition ?? null;
        const pb = b.winnerPosition ?? null;
        if (pa !== null && pb !== null) return pa - pb;
        if (pa === null && pb !== null) return 1;
        if (pb === null && pa !== null) return -1;
      }
      if (a.likeCount !== b.likeCount) return b.likeCount - a.likeCount;
      return b.at.getTime() - a.at.getTime();
    });
    return found.map(({ at, item }) => asItem({ ...item, createdAt: iso(at) }));
  });

  return TalentFeed.of({ list, post });
});

export const layer = Layer.effect(TalentFeed, make);
