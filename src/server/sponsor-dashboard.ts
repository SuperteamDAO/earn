import 'server-only';

import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Schema from 'effect/Schema';

import type { Prisma } from '@/prisma/client';
import * as Database from '@/server/database';

// A hackathon sponsors can add a track to, as the create-listing menus list
// them.
export interface ActiveHackathon {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly altLogo: string | null;
  readonly logo: string;
  readonly startDate: Date | null;
  readonly deadline: Date | null;
  readonly eligibility: Prisma.JsonValue | null;
}

// A row of the dashboard's listings table: bounties and hackathon tracks
// (not closed) and open grants, as Earn's /api/sponsor-dashboard/listings
// returned them.
export interface DashboardListing {
  readonly type: 'bounty' | 'hackathon' | 'grant';
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly token: string | undefined;
  readonly status: 'OPEN' | 'REVIEW' | 'CLOSED' | 'VERIFYING' | 'VERIFY_FAIL';
  readonly deadline: string | undefined;
  readonly isPublished: boolean;
  readonly publishedAt: string | undefined;
  readonly rewards: Record<string, number> | undefined;
  readonly rewardAmount: number | undefined;
  readonly totalPaymentsMade: number;
  readonly maxBonusSpots: number | undefined;
  readonly isWinnersAnnounced: boolean;
  readonly maxRewardAsk: number | undefined;
  readonly minRewardAsk: number | undefined;
  readonly compensationType: 'fixed' | 'range' | 'variable' | undefined;
  readonly submissionCount: number;
  readonly isFndnPaying: boolean;
}

export interface SponsorStats {
  readonly yearOnPlatform: number;
  readonly totalRewardAmount: number;
  readonly totalListingsAndGrants: number;
  readonly totalSubmissionsAndApplications: number;
}

export interface HackathonStats {
  readonly name: string;
  readonly logo: string | null;
  readonly totalHackathonRewards: number;
  readonly totalHackathonTracks: number;
  readonly totalHackathonSubmissions: number;
}

// A track on the hackathon dashboard.
export interface HackathonTrack {
  readonly id: string;
  readonly title: string;
  readonly type: 'bounty' | 'hackathon' | 'grant';
  readonly slug: string;
  readonly token: string | undefined;
  readonly status: 'OPEN' | 'REVIEW' | 'CLOSED' | 'VERIFYING' | 'VERIFY_FAIL';
  readonly deadline: string | undefined;
  readonly isPublished: boolean;
  readonly rewards: Record<string, number> | undefined;
  readonly rewardAmount: number | undefined;
  readonly isWinnersAnnounced: boolean;
  readonly sponsor: { readonly name: string; readonly logo: string | null };
  readonly submissionCount: number;
  readonly totalPaymentsMade: number;
}

export interface HackathonTracks {
  readonly total: number;
  readonly startDate: string | undefined;
  readonly listings: ReadonlyArray<HackathonTrack>;
}

// The sponsor has no current hackathon to show.
export class NoHackathon extends Schema.TaggedError<NoHackathon>()(
  'NoHackathon',
  {},
) {
  override get message() {
    return 'No hackathon selected';
  }
}

// Five published listings past their deadline without winners lock the
// "Create New Listing" button, as Earn's is-create-allowed decides.
export const IN_REVIEW_LIMIT = 5;

export const TRACKS_PER_PAGE = 15;

export class SponsorDashboard extends Context.Service<
  SponsorDashboard,
  {
    readonly activeHackathons: Effect.Effect<
      ReadonlyArray<ActiveHackathon>,
      Database.DatabaseError
    >;
    readonly createAllowed: (
      sponsorId: string,
    ) => Effect.Effect<boolean, Database.DatabaseError>;
    readonly listings: (
      sponsorId: string,
    ) => Effect.Effect<ReadonlyArray<DashboardListing>, Database.DatabaseError>;
    readonly sponsorStats: (
      sponsorId: string,
    ) => Effect.Effect<SponsorStats | null, Database.DatabaseError>;
    readonly hackathonStats: (
      hackathonId: string | null,
    ) => Effect.Effect<HackathonStats | null, Database.DatabaseError>;
    readonly hackathonTracks: (
      hackathonId: string | null,
      page: { readonly search: string; readonly skip: number },
    ) => Effect.Effect<HackathonTracks, NoHackathon | Database.DatabaseError>;
  }
>()('earn/SponsorDashboard') {}

// MySQL hands booleans back as 0/1 (or '0'/'1') from raw queries.
const flag = (value: unknown) => Boolean(Number(value ?? 0));
const num = (value: unknown) =>
  value === null || value === undefined ? undefined : Number(value);
const iso = (value: unknown) =>
  value instanceof Date
    ? value.toISOString()
    : typeof value === 'string'
      ? value
      : undefined;
// A listing's rewards: prize position to amount.
const json = (value: unknown): Record<string, number> | undefined => {
  let parsed: unknown = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch {
      return undefined;
    }
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return undefined;
  }
  const rewards: Record<string, number> = {};
  for (const [key, amount] of Object.entries(parsed)) {
    if (typeof amount === 'number') rewards[key] = amount;
  }
  return rewards;
};
const text = (value: unknown) =>
  typeof value === 'string' || typeof value === 'number' ? String(value) : '';
const listingType = (value: unknown): DashboardListing['type'] =>
  value === 'grant' || value === 'hackathon' ? value : 'bounty';
const listingStatus = (value: unknown): DashboardListing['status'] =>
  value === 'REVIEW' ||
  value === 'CLOSED' ||
  value === 'VERIFYING' ||
  value === 'VERIFY_FAIL'
    ? value
    : 'OPEN';
const compensation = (value: unknown): DashboardListing['compensationType'] =>
  value === 'fixed' || value === 'range' || value === 'variable'
    ? value
    : undefined;

type ListingRow = Record<string, unknown>;

export const toDashboardListing = (row: ListingRow): DashboardListing => ({
  type: listingType(row.type),
  id: text(row.id),
  title: text(row.title),
  slug: text(row.slug),
  token: typeof row.token === 'string' ? row.token : undefined,
  status: listingStatus(row.status),
  deadline: iso(row.deadline),
  isPublished: flag(row.isPublished),
  publishedAt: iso(row.publishedAt),
  rewards: json(row.rewards),
  rewardAmount: num(row.rewardAmount),
  totalPaymentsMade: Number(row.totalPaymentsMade ?? 0),
  maxBonusSpots: num(row.maxBonusSpots),
  isWinnersAnnounced: flag(row.isWinnersAnnounced),
  maxRewardAsk: num(row.maxRewardAsk),
  minRewardAsk: num(row.minRewardAsk),
  compensationType: compensation(row.compensationType),
  submissionCount: Number(row.submissionCount ?? 0),
  isFndnPaying: flag(row.isFndnPaying),
});

const make = Effect.gen(function* () {
  const database = yield* Database.Database;

  // Earn's /api/sponsor-dashboard/active-hackathons: upcoming hackathons of
  // Superteam chapters, and the Crypto World's Fair.
  const activeHackathons = database
    .query('activeHackathons', (client) =>
      client.hackathon.findMany({
        where: {
          deadline: { not: null, gt: new Date() },
          OR: [
            { slug: 'crypto-worlds-fair' },
            { Sponsor: { chapter: { isNot: null } } },
          ],
        },
        select: {
          id: true,
          name: true,
          slug: true,
          altLogo: true,
          logo: true,
          startDate: true,
          deadline: true,
          eligibility: true,
        },
      }),
    )
    .pipe(Effect.withSpan('SponsorDashboard.activeHackathons'));

  const createAllowed = Effect.fn('SponsorDashboard.createAllowed')(function* (
    sponsorId: string,
  ) {
    const inReview = yield* database.query('listingsInReview', (client) =>
      client.bounties.count({
        where: {
          sponsorId,
          isPublished: true,
          isActive: true,
          deadline: { lte: new Date() },
          isWinnersAnnounced: false,
        },
      }),
    );
    return inReview < IN_REVIEW_LIMIT;
  });

  // Earn's query, verbatim: its two halves line up by position, as MySQL
  // reads a UNION, so grants' columns land where they always have.
  const listings = Effect.fn('SponsorDashboard.listings')(function* (
    sponsorId: string,
  ) {
    const rows = yield* database.query(
      'dashboardListings',
      (client) =>
        client.$queryRaw<Array<ListingRow>>`
      WITH combined_data AS (
        SELECT
          b.type as type,
          b.id,
          b.title,
          b.slug,
          b.token,
          b.status,
          b.deadline,
          b.isPublished,
          b.publishedAt,
          b.rewards,
          b.rewardAmount,
          (SELECT COUNT(*) FROM Submission s WHERE s.listingId = b.id AND s.isPaid = 1) as totalPaymentsMade,
          b.maxBonusSpots,
          b.isWinnersAnnounced,
          b.maxRewardAsk,
          b.minRewardAsk,
          b.compensationType,
          b.createdAt,
          b.isFndnPaying,
          b.usdValue,
          NULL as airtableId,
          CAST((SELECT COUNT(*) FROM Submission s WHERE s.listingId = b.id) AS SIGNED) as submissionCount
        FROM Bounties b
        WHERE b.isActive = true
        AND b.isArchived = false
        AND b.sponsorId = ${sponsorId}
        AND b.status <> 'CLOSED'

        UNION ALL

        SELECT
          'grant' as type,
          g.id,
          g.title,
          g.slug,
          g.token,
          g.status,
          NULL as deadline,
          g.isPublished,
          NULL as publishedAt,
          NULL as rewards,
          NULL as rewardAmount,
          g.totalPaid as totalPaymentsMade,
          NULL as isWinnersAnnounced,
          g.minReward as minRewardAsk,
          g.maxReward as maxRewardAsk,
          NULL as compensationType,
          g.createdAt,
          NULL as isFndnPaying,
          NULL as usdValue,
          g.airtableId,
          NULL as maxBonusSpots,
          CAST((SELECT COUNT(*) FROM GrantApplication ga WHERE ga.grantId = g.id) AS SIGNED) as submissionCount
        FROM Grants g
        WHERE g.isActive = true
        AND g.isArchived = false
        AND g.sponsorId = ${sponsorId}
        AND g.status = 'OPEN'
      )
      SELECT *
      FROM combined_data
      ORDER BY createdAt DESC
    `,
    );
    return rows.map(toDashboardListing);
  });

  // Earn's getSponsorStats, less the completion rate the dashboard never
  // showed.
  const sponsorStats = Effect.fn('SponsorDashboard.sponsorStats')(function* (
    sponsorId: string,
  ) {
    return yield* database.query('sponsorStats', async (client) => {
      const sponsor = await client.sponsors.findUnique({
        where: { id: sponsorId },
        select: { createdAt: true },
      });
      if (!sponsor) return null;
      const awarded = {
        grant: { sponsorId },
        OR: [
          { applicationStatus: 'Approved' as const },
          { applicationStatus: 'Completed' as const },
        ],
      };
      const [
        listingRewards,
        grantRewards,
        totalListings,
        totalGrants,
        totalApplications,
        totalSubmissions,
      ] = await Promise.all([
        client.bounties.aggregate({
          _sum: { usdValue: true },
          where: {
            isWinnersAnnounced: true,
            isPublished: true,
            status: 'OPEN',
            sponsorId,
          },
        }),
        client.grantApplication.aggregate({
          _sum: { approvedAmountInUSD: true },
          where: awarded,
        }),
        client.bounties.count({
          where: {
            sponsorId,
            isActive: true,
            isArchived: false,
            status: 'OPEN',
          },
        }),
        client.grants.count({
          where: {
            sponsorId,
            isActive: true,
            isArchived: false,
            status: 'OPEN',
          },
        }),
        client.grantApplication.count({ where: awarded }),
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
      ]);
      return {
        yearOnPlatform: sponsor.createdAt.getFullYear(),
        totalRewardAmount:
          (listingRewards._sum.usdValue ?? 0) +
          (grantRewards._sum.approvedAmountInUSD ?? 0),
        totalListingsAndGrants: totalListings + totalGrants,
        totalSubmissionsAndApplications: totalSubmissions + totalApplications,
      } satisfies SponsorStats;
    });
  });

  // Earn's /api/hackathon/stats for the hackathon they've switched to.
  const hackathonStats = Effect.fn('SponsorDashboard.hackathonStats')(
    function* (hackathonId: string | null) {
      if (!hackathonId) return null;
      return yield* database.query('hackathonStats', async (client) => {
        const hackathon = await client.hackathon.findUnique({
          where: { id: hackathonId },
          select: { id: true, name: true, altLogo: true },
        });
        if (!hackathon) return null;
        const tracks = {
          hackathonId: hackathon.id,
          isActive: true,
          isArchived: false,
          status: 'OPEN' as const,
          isPublished: true,
        };
        const [totalListings, totalSubmissions, rewards] = await Promise.all([
          client.bounties.count({ where: tracks }),
          client.submission.count({
            where: {
              listing: {
                hackathonId: hackathon.id,
                isActive: true,
                isArchived: false,
                status: 'OPEN',
              },
            },
          }),
          client.bounties.aggregate({
            _sum: { usdValue: true },
            where: tracks,
          }),
        ]);
        return {
          name: hackathon.name,
          logo: hackathon.altLogo,
          totalHackathonRewards: rewards._sum.usdValue ?? 0,
          totalHackathonTracks: totalListings,
          totalHackathonSubmissions: totalSubmissions,
        } satisfies HackathonStats;
      });
    },
  );

  // Earn's /api/hackathon/listings: the hackathon's published tracks.
  const hackathonTracks = Effect.fn('SponsorDashboard.hackathonTracks')(
    function* (
      hackathonId: string | null,
      page: { readonly search: string; readonly skip: number },
    ) {
      if (!hackathonId) return yield* new NoHackathon();
      const hackathon = yield* database.query('hackathon', (client) =>
        client.hackathon.findUnique({
          where: { id: hackathonId },
          select: { id: true, startDate: true },
        }),
      );
      if (!hackathon) return yield* new NoHackathon();
      const where = {
        isActive: true,
        isArchived: false,
        hackathonId: hackathon.id,
        status: 'OPEN' as const,
        isPublished: true,
        ...(page.search ? { title: { contains: page.search } } : {}),
      };
      const [total, rows] = yield* database.query('hackathonTracks', (client) =>
        Promise.all([
          client.bounties.count({ where }),
          client.bounties.findMany({
            where,
            skip: page.skip,
            take: TRACKS_PER_PAGE,
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            select: {
              id: true,
              title: true,
              type: true,
              slug: true,
              token: true,
              status: true,
              deadline: true,
              isPublished: true,
              rewards: true,
              rewardAmount: true,
              isWinnersAnnounced: true,
              sponsor: { select: { name: true, logo: true } },
              Submission: {
                where: {
                  OR: [{ isActive: true, isArchived: false }, { isPaid: true }],
                },
                select: { isActive: true, isArchived: true, isPaid: true },
              },
            },
          }),
        ]),
      );
      return {
        total,
        startDate: hackathon.startDate?.toISOString(),
        listings: rows.map((row): HackathonTrack => ({
          id: row.id,
          title: row.title,
          type: listingType(row.type),
          slug: row.slug,
          token: row.token ?? undefined,
          status: row.status,
          deadline: row.deadline?.toISOString(),
          isPublished: row.isPublished,
          rewards: json(row.rewards),
          rewardAmount: row.rewardAmount ?? undefined,
          isWinnersAnnounced: row.isWinnersAnnounced,
          sponsor: row.sponsor,
          submissionCount: row.Submission.filter(
            (sub) => sub.isActive && !sub.isArchived,
          ).length,
          totalPaymentsMade: row.Submission.filter((sub) => sub.isPaid).length,
        })),
      } satisfies HackathonTracks;
    },
  );

  return SponsorDashboard.of({
    activeHackathons,
    createAllowed,
    listings,
    sponsorStats,
    hackathonStats,
    hackathonTracks,
  });
});

export const layer = Layer.effect(SponsorDashboard, make);
