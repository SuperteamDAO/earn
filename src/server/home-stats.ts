import 'server-only';

import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Duration from 'effect/Duration';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';

import * as Database from '@/server/database';
import { cached } from '@/server/home-cache';

// /api/homepage/stats: what Earn has paid out (listings and grants), and
// how many listings it has published.
export interface Totals {
  readonly totalInUSD: number;
  readonly count: number;
}

// One line of the sidebar's RECENT EARNERS (/api/homepage/recent-earners).
export interface Earner {
  readonly id: string;
  readonly username: string | null;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly slug: string;
  readonly title: string;
  readonly reward: number | undefined;
  readonly rewardToken: string | null;
  readonly photo: string | null;
  readonly winnersAnnouncedAt: Date | null;
}

// One line of the sidebar's RECENT ACTIVITY (/api/homepage/feed).
export interface Activity {
  readonly createdAt: Date;
  readonly isWinner: boolean;
  readonly listing: {
    readonly type: string;
    readonly isWinnersAnnounced: boolean;
  };
  readonly user: {
    readonly firstName: string | null;
    readonly lastName: string | null;
    readonly username: string | null;
  };
}

// /api/user/stats.
export interface UserStats {
  readonly participations: number;
  readonly wins: number;
  readonly totalWinnings: number;
}

// Earn's getSponsorStats (the sponsor page and /api/sponsors/stats).
export interface SponsorStats {
  readonly yearOnPlatform: number;
  readonly totalRewardAmount: number;
  readonly totalListingsAndGrants: number;
  readonly totalSubmissionsAndApplications: number;
  readonly completionRate: number;
}

export const CATEGORY_FILTERS = ['design', 'content', 'development'] as const;
export type CategoryFilter = (typeof CATEGORY_FILTERS)[number];

export class UserNotFound extends Schema.TaggedError<UserNotFound>()(
  'UserNotFound',
  {},
) {
  override get message() {
    return 'User not found';
  }
}

export class SponsorNotFound extends Schema.TaggedError<SponsorNotFound>()(
  'SponsorNotFound',
  {},
) {
  override get message() {
    return 'Sponsor not found';
  }
}

type Query<A> = Effect.Effect<A, Database.DatabaseError>;

export class HomeStats extends Context.Service<
  HomeStats,
  {
    readonly totals: Query<Totals>;
    readonly userCount: Query<{ readonly totalUsers: number }>;
    readonly sponsorCount: Query<{ readonly totalSponsors: number }>;
    readonly recentEarners: Query<ReadonlyArray<Earner>>;
    readonly recentActivity: Query<ReadonlyArray<Activity>>;
    readonly liveOpportunities: Query<{ readonly totalUsdValue: number }>;
    readonly categoryEarnings: (
      filter: CategoryFilter,
    ) => Query<{ readonly totalEarnings: number }>;
    readonly userStats: (
      userId: string,
    ) => Effect.Effect<UserStats, UserNotFound | Database.DatabaseError>;
    readonly sponsorStats: (
      sponsorId: string,
    ) => Effect.Effect<SponsorStats, SponsorNotFound | Database.DatabaseError>;
  }
>()('earn/HomeStats') {}

// Earn rounds its public counts up to the next ten; 289 accounts were
// created in error and don't count.
const roundUpToTen = (value: number) => Math.ceil(value / 10) * 10;
const ERROR_ACCOUNTS = 289;

const APPROVED = {
  OR: [
    { applicationStatus: 'Approved' as const },
    { applicationStatus: 'Completed' as const },
  ],
};

// Earn's skill groups for /api/listings/category-earnings.
const SKILLS_OF: Record<CategoryFilter, string[]> = {
  development: ['Frontend', 'Backend', 'Blockchain', 'Mobile'],
  design: ['Design'],
  content: ['Content'],
};

const Rewards = Schema.Record(Schema.String, Schema.Finite);

export function skillsFilter(filter: CategoryFilter) {
  const skills = SKILLS_OF[filter];
  return filter === 'development'
    ? {
        OR: skills.map((skill) => ({
          skills: { path: '$[*].skills', array_contains: [skill] },
        })),
      }
    : { skills: { path: '$[*].skills', array_contains: skills } };
}

const make = Effect.gen(function* () {
  const database = yield* Database.Database;

  const totals = yield* cached(
    Effect.gen(function* () {
      const [count, listings, grants] = yield* Effect.all(
        [
          database.query('publishedListingCount', (client) =>
            client.bounties.count({ where: { isPublished: true } }),
          ),
          database.query('listingRewardsPaid', (client) =>
            client.bounties.aggregate({
              _sum: { usdValue: true },
              where: {
                isWinnersAnnounced: true,
                isPublished: true,
                status: 'OPEN',
              },
            }),
          ),
          database.query('grantsApproved', (client) =>
            client.grantApplication.aggregate({
              _sum: { approvedAmountInUSD: true },
              where: APPROVED,
            }),
          ),
        ],
        { concurrency: 'unbounded' },
      );
      return {
        totalInUSD: roundUpToTen(
          (listings._sum.usdValue || 0) +
            (grants._sum.approvedAmountInUSD || 0),
        ),
        count,
      };
    }),
    Duration.hours(1),
  );

  const userCount = yield* cached(
    database
      .query('userCount', (client) => client.user.count())
      .pipe(
        Effect.map((count) => ({
          totalUsers: roundUpToTen(count - ERROR_ACCOUNTS),
        })),
      ),
    Duration.hours(1),
  );

  const sponsorCount = yield* cached(
    database
      .query('sponsorCount', (client) => client.sponsors.count())
      .pipe(Effect.map((count) => ({ totalSponsors: roundUpToTen(count) }))),
    Duration.hours(1),
  );

  const recentEarners = yield* cached(
    database
      .query('recentEarners', (client) =>
        client.submission.findMany({
          where: {
            isWinner: true,
            listing: { isWinnersAnnounced: true, isPrivate: false },
            rewardInUSD: { gte: 200 },
          },
          select: {
            winnerPosition: true,
            user: {
              select: {
                id: true,
                username: true,
                photo: true,
                firstName: true,
                lastName: true,
              },
            },
            listing: {
              select: {
                slug: true,
                title: true,
                rewards: true,
                token: true,
                winnersAnnouncedAt: true,
              },
            },
          },
          take: 30,
          orderBy: { listing: { winnersAnnouncedAt: 'desc' } },
        }),
      )
      .pipe(
        Effect.map((rows) =>
          rows.map((row): Earner => {
            const rewards = Schema.decodeUnknownOption(Rewards)(
              row.listing.rewards,
            ).pipe(Option.getOrElse((): Record<string, number> => ({})));
            return {
              id: row.user.id,
              username: row.user.username,
              firstName: row.user.firstName,
              lastName: row.user.lastName,
              slug: row.listing.slug,
              title: row.listing.title,
              reward: rewards[String(Number(row.winnerPosition))],
              rewardToken: row.listing.token,
              photo: row.user.photo,
              winnersAnnouncedAt: row.listing.winnersAnnouncedAt,
            };
          }),
        ),
      ),
    Duration.hours(1),
  );

  const recentActivity = yield* cached(
    database.query('recentActivity', (client) =>
      client.submission.findMany({
        where: { isArchived: false, isActive: true },
        take: 5,
        select: {
          createdAt: true,
          isWinner: true,
          listing: { select: { type: true, isWinnersAnnounced: true } },
          user: {
            select: { firstName: true, lastName: true, username: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ),
    Duration.minutes(5),
  );

  const liveOpportunities = yield* cached(
    Effect.gen(function* () {
      const now = new Date(yield* Clock.currentTimeMillis);
      const result = yield* database.query('liveOpportunities', (client) =>
        client.bounties.aggregate({
          where: {
            status: 'OPEN',
            isPublished: true,
            isArchived: false,
            isPrivate: false,
            isActive: true,
            isWinnersAnnounced: false,
            deadline: { gt: now },
          },
          _sum: { usdValue: true },
        }),
      );
      return { totalUsdValue: Math.round(result._sum.usdValue || 0) };
    }),
    Duration.hours(1),
  );

  const earningsByCategory = new Map<
    CategoryFilter,
    Query<{ readonly totalEarnings: number }>
  >();
  for (const filter of CATEGORY_FILTERS) {
    earningsByCategory.set(
      filter,
      yield* cached(
        database
          .query('categoryEarnings', (client) =>
            client.bounties.aggregate({
              where: {
                isWinnersAnnounced: true,
                isPublished: true,
                status: 'OPEN',
                ...skillsFilter(filter),
              },
              _sum: { usdValue: true },
            }),
          )
          .pipe(
            Effect.map((result) => ({
              totalEarnings: Math.round(result._sum.usdValue || 0),
            })),
          ),
        Duration.hours(1),
      ),
    );
  }
  const categoryEarnings = (filter: CategoryFilter) =>
    earningsByCategory.get(filter) ??
    Effect.succeed({ totalEarnings: 0 } as const);

  const userStats = Effect.fn('HomeStats.userStats')(function* (
    userId: string,
  ) {
    const rows = yield* database.query(
      'userStats',
      (client) =>
        client.$queryRaw<
          Array<{
            participations: bigint;
            wins: bigint;
            totalWinnings: number;
          }>
        >`
      SELECT
        COALESCE(submission_stats.total_submissions, 0) as participations,
        COALESCE(submission_stats.wins, 0) as wins,
        COALESCE(submission_stats.listing_winnings, 0) as listingWinnings,
        COALESCE(grant_stats.grant_winnings, 0) as grantWinnings,
        COALESCE(submission_stats.listing_winnings, 0) + COALESCE(grant_stats.grant_winnings, 0) as totalWinnings
      FROM User u
      LEFT JOIN (
        SELECT
          s.userId,
          COUNT(*) as total_submissions,
          COUNT(CASE WHEN s.isWinner = true AND l.isWinnersAnnounced = true THEN 1 END) as wins,
          COALESCE(SUM(CASE WHEN s.isWinner = true AND l.isWinnersAnnounced = true THEN s.rewardInUSD ELSE 0 END), 0) as listing_winnings
        FROM Submission s
        INNER JOIN Bounties l ON s.listingId = l.id
        WHERE s.userId = ${userId}
        GROUP BY s.userId
      ) submission_stats ON u.id = submission_stats.userId
      LEFT JOIN (
        SELECT
          ga.userId,
          COALESCE(SUM(CASE WHEN ga.applicationStatus IN ('Approved', 'Completed') THEN ga.approvedAmountInUSD ELSE 0 END), 0) as grant_winnings
        FROM GrantApplication ga
        WHERE ga.userId = ${userId}
        GROUP BY ga.userId
      ) grant_stats ON u.id = grant_stats.userId
      WHERE u.id = ${userId}
    `,
    );
    const row = rows[0];
    if (!row) return yield* new UserNotFound();
    return {
      participations: Number(row.participations),
      wins: Number(row.wins),
      totalWinnings: row.totalWinnings,
    } satisfies UserStats;
  });

  const sponsorStats = Effect.fn('HomeStats.sponsorStats')(function* (
    sponsorId: string,
  ) {
    const sponsor = yield* database.query('sponsorCreatedAt', (client) =>
      client.sponsors.findUnique({
        where: { id: sponsorId },
        select: { createdAt: true },
      }),
    );
    if (!sponsor) return yield* new SponsorNotFound();
    const now = new Date(yield* Clock.currentTimeMillis);
    const live = {
      sponsorId,
      isActive: true,
      isArchived: false,
      status: 'OPEN' as const,
    };
    const [
      listingRewards,
      grantRewards,
      listings,
      grants,
      applications,
      submissions,
      eligible,
    ] = yield* Effect.all(
      [
        database.query('sponsorListingRewards', (client) =>
          client.bounties.aggregate({
            _sum: { usdValue: true },
            where: {
              isWinnersAnnounced: true,
              isPublished: true,
              status: 'OPEN',
              sponsorId,
            },
          }),
        ),
        database.query('sponsorGrantRewards', (client) =>
          client.grantApplication.aggregate({
            _sum: { approvedAmountInUSD: true },
            where: { grant: { sponsorId }, ...APPROVED },
          }),
        ),
        database.query('sponsorListingCount', (client) =>
          client.bounties.count({ where: live }),
        ),
        database.query('sponsorGrantCount', (client) =>
          client.grants.count({ where: live }),
        ),
        database.query('sponsorApplicationCount', (client) =>
          client.grantApplication.count({
            where: { grant: { sponsorId }, ...APPROVED },
          }),
        ),
        database.query('sponsorSubmissionCount', (client) =>
          client.submission.count({
            where: {
              listing: {
                sponsorId,
                isActive: true,
                isArchived: false,
                status: 'OPEN',
              },
            },
          }),
        ),
        database.query('sponsorEligibleBounties', (client) =>
          client.bounties.findMany({
            where: {
              sponsorId,
              isPublished: true,
              isPrivate: false,
              type: { in: ['bounty', 'hackathon'] },
              deadline: { lt: now },
            },
            select: {
              id: true,
              isWinnersAnnounced: true,
              _count: { select: { Submission: true } },
            },
          }),
        ),
      ],
      { concurrency: 'unbounded' },
    );
    // Bounties with at least three submissions count toward completion.
    const counted = eligible.filter((bounty) => bounty._count.Submission >= 3);
    const completed = counted.filter(
      (bounty) => bounty.isWinnersAnnounced,
    ).length;
    return {
      yearOnPlatform: sponsor.createdAt.getFullYear(),
      totalRewardAmount:
        (listingRewards._sum.usdValue || 0) +
        (grantRewards._sum.approvedAmountInUSD || 0),
      totalListingsAndGrants: listings + grants,
      totalSubmissionsAndApplications: submissions + applications,
      completionRate:
        counted.length > 0 ? (completed / counted.length) * 100 : 0,
    } satisfies SponsorStats;
  });

  return HomeStats.of({
    totals,
    userCount,
    sponsorCount,
    recentEarners,
    recentActivity,
    liveOpportunities,
    categoryEarnings,
    userStats,
    sponsorStats,
  });
});

export const layer = Layer.effect(HomeStats, make);
