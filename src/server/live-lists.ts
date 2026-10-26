import 'server-only';

import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';

import type { Prisma } from '@/prisma/client';
import * as Database from '@/server/database';
import * as HomeChapters from '@/server/home-chapters';
import { combinedRegionsFor } from '@/server/home-regions';

// A listing as the list cards show it (Earn's `listingSelect`).
export const LISTING_CARD = {
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
} satisfies Prisma.BountiesSelect;

export type LiveListing = Prisma.BountiesGetPayload<{
  select: typeof LISTING_CARD;
}>;

// A grant as the grant cards show it (Earn's `grantsSelect`, with its id).
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
} satisfies Prisma.GrantsSelect;

type GrantRow = Prisma.GrantsGetPayload<{ select: typeof GRANT_CARD }>;

export type LiveGrant = Omit<GrantRow, 'GrantApplication' | '_count'> & {
  readonly approvedAmountTotal: number;
  readonly totalApplications: number;
};

// Approved and completed applications: what they were granted, and how
// many (plus those from before Earn).
export const withApplicationTotals = ({
  GrantApplication,
  _count,
  ...grant
}: GrantRow): LiveGrant => ({
  ...grant,
  approvedAmountTotal: GrantApplication.reduce(
    (sum, application) => sum + (application.approvedAmountInUSD || 0),
    0,
  ),
  totalApplications: _count.GrantApplication + grant.historicalApplications,
});

export interface LiveListingsQuery {
  readonly take: number;
  // Only listings due after this (Earn's sidebar asks for tomorrow on).
  readonly deadline: Date | null;
  readonly type: 'bounty' | 'hackathon';
  readonly excludeIds: ReadonlyArray<string>;
  readonly exclusiveSponsorId: string | null;
}

export interface LiveGrantsQuery {
  readonly take: number;
  readonly excludeIds: ReadonlyArray<string>;
}

// Who's asking, as these lists care.
export interface ListViewer {
  readonly userId: string;
  readonly location: string | null;
  readonly isBlocked: boolean;
}

// The sidebar's live lists and the viewer's bookmarks (Earn's
// /api/listings/live, /api/grants/live and /api/listings/bookmarks).
export class LiveLists extends Context.Service<
  LiveLists,
  {
    readonly viewer: (
      privyDid: string,
    ) => Effect.Effect<Option.Option<ListViewer>, Database.DatabaseError>;
    // In the regions open to someone in `location`; only Global ones
    // without a location (or signed out).
    readonly listings: (
      query: LiveListingsQuery,
      location: string | null,
    ) => Effect.Effect<ReadonlyArray<LiveListing>, Database.DatabaseError>;
    // In the viewer's regions; signed out (null), every region.
    readonly grants: (
      query: LiveGrantsQuery,
      viewer: { readonly location: string | null } | null,
    ) => Effect.Effect<ReadonlyArray<LiveGrant>, Database.DatabaseError>;
    readonly bookmarks: (
      userId: string,
      take: number | undefined,
    ) => Effect.Effect<ReadonlyArray<LiveListing>, Database.DatabaseError>;
  }
>()('earn/LiveLists') {}

const make = Effect.gen(function* () {
  const database = yield* Database.Database;
  const chapters = yield* HomeChapters.HomeChapters;

  const regionsFor = (location: string | null) =>
    location
      ? chapters.all.pipe(
          Effect.map((all) => combinedRegionsFor(all, location)),
        )
      : Effect.succeed(['Global']);

  const viewer = Effect.fn('LiveLists.viewer')(function* (privyDid: string) {
    const user = yield* database.query('liveListViewer', (client) =>
      client.user.findUnique({
        where: { privyDid },
        select: { id: true, location: true, isBlocked: true },
      }),
    );
    return Option.fromNullishOr(user).pipe(
      Option.map((row): ListViewer => ({
        userId: row.id,
        location: row.location,
        isBlocked: row.isBlocked,
      })),
    );
  });

  const listings = Effect.fn('LiveLists.listings')(function* (
    query: LiveListingsQuery,
    location: string | null,
  ) {
    const regions = yield* regionsFor(location);
    return yield* database.query('liveListings', (client) =>
      client.bounties.findMany({
        where: {
          id: { notIn: [...query.excludeIds] },
          isPublished: true,
          isActive: true,
          isPrivate: false,
          isArchived: false,
          status: 'OPEN',
          ...(query.deadline ? { deadline: { gte: query.deadline } } : {}),
          type: query.type,
          region: { in: regions },
          ...(query.exclusiveSponsorId
            ? { sponsorId: query.exclusiveSponsorId }
            : {}),
        },
        select: LISTING_CARD,
        take: query.take,
        orderBy: [{ deadline: 'asc' }, { winnersAnnouncedAt: 'desc' }],
      }),
    );
  });

  const grants = Effect.fn('LiveLists.grants')(function* (
    query: LiveGrantsQuery,
    viewerOrNull: { readonly location: string | null } | null,
  ) {
    const regions = viewerOrNull
      ? yield* regionsFor(viewerOrNull.location)
      : null;
    const rows = yield* database.query('liveGrants', (client) =>
      client.grants.findMany({
        where: {
          isPublished: true,
          isActive: true,
          isArchived: false,
          isPrivate: false,
          id: { notIn: [...query.excludeIds] },
          ...(regions ? { region: { in: regions } } : {}),
        },
        take: query.take,
        orderBy: { createdAt: 'desc' },
        select: GRANT_CARD,
      }),
    );
    return rows.map(withApplicationTotals);
  });

  const bookmarks = Effect.fn('LiveLists.bookmarks')(function* (
    userId: string,
    take: number | undefined,
  ) {
    return yield* database.query('bookmarks', (client) =>
      client.bounties.findMany({
        where: {
          SubscribeBounty: { some: { userId, isArchived: false } },
          isActive: true,
          isArchived: false,
          isPublished: true,
        },
        select: LISTING_CARD,
        take,
        orderBy: { createdAt: 'desc' },
      }),
    );
  });

  return LiveLists.of({ viewer, listings, grants, bookmarks });
});

export const layer = Layer.effect(LiveLists, make);
