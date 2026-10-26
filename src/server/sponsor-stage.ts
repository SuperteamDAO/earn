import 'server-only';

import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';

import type { Prisma } from '@/prisma/client';
import * as Database from '@/server/database';
import { dayjs } from '@/utils/dayjs';

import { SponsorStage } from '@/features/home/types/sponsor-stage';
import type { Listing } from '@/features/listings/types';

// Where a sponsor stands, for the homepage's banner, snackbar and sidebar
// (Earn's /api/homepage/sponsor-stage). The enum lives with the UI that
// switches on it.
export { SponsorStage };

export interface SponsorStageData {
  readonly stage: SponsorStage | null;
  readonly listing: Listing | null;
  // Active submissions on that listing (the sidebar's count).
  readonly submissionCount: number | null;
}

const PAYMENT_REMINDER_MAX_DAYS = 7;

const STAGE_LISTING = {
  id: true,
  title: true,
  slug: true,
  type: true,
  deadline: true,
  commitmentDate: true,
  isPublished: true,
  isActive: true,
  isArchived: true,
  isWinnersAnnounced: true,
  winnersAnnouncedAt: true,
  usdValue: true,
  publishedAt: true,
  status: true,
  updatedAt: true,
  region: true,
  sponsorId: true,
  token: true,
  rewardAmount: true,
  compensationType: true,
  minRewardAsk: true,
  maxRewardAsk: true,
  rewards: true,
  maxBonusSpots: true,
  isFndnPaying: true,
  sponsor: { select: { name: true, slug: true, logo: true } },
} satisfies Prisma.BountiesSelect;

export type StageListing = Prisma.BountiesGetPayload<{
  select: typeof STAGE_LISTING;
}>;

interface Staged {
  readonly listing: StageListing;
  readonly stage: SponsorStage;
  readonly sortDate: Date;
}

const isVerified = (listing: StageListing) =>
  listing.status === 'OPEN' && listing.isPublished && !listing.isArchived;

const isReviewable = (listing: StageListing) =>
  isVerified(listing) && !listing.isWinnersAnnounced;

function stageOf(
  listing: StageListing,
  hasUnpaidWinners: boolean,
  now: Date,
): Staged | null {
  const at = dayjs(now);
  const deadline = listing.deadline ? dayjs(listing.deadline) : null;
  const commitment = listing.commitmentDate
    ? dayjs(listing.commitmentDate)
    : null;
  const staged = (stage: SponsorStage, sortDate: Date): Staged => ({
    listing,
    stage,
    sortDate,
  });

  if (listing.status === 'VERIFYING') {
    return staged(
      SponsorStage.UNDER_VERIFICATION,
      listing.publishedAt ?? listing.updatedAt ?? now,
    );
  }
  if (commitment && commitment.isBefore(at) && isReviewable(listing)) {
    return staged(SponsorStage.REVIEW_URGENT, commitment.toDate());
  }
  if (
    isVerified(listing) &&
    listing.isWinnersAnnounced &&
    listing.type === 'bounty' &&
    hasUnpaidWinners &&
    !listing.isFndnPaying
  ) {
    return staged(
      SponsorStage.PAYMENT_PENDING,
      listing.winnersAnnouncedAt ?? now,
    );
  }
  if (deadline && deadline.isBefore(at) && isReviewable(listing)) {
    return staged(SponsorStage.REVIEW, deadline.toDate());
  }
  if (listing.isArchived || listing.status === 'CLOSED') {
    return staged(
      SponsorStage.NEXT_LISTING,
      listing.winnersAnnouncedAt ?? listing.updatedAt ?? now,
    );
  }
  return null;
}

const PRIORITY: Record<SponsorStage, number> = {
  [SponsorStage.REVIEW_URGENT]: 1,
  [SponsorStage.PAYMENT_PENDING]: 2,
  [SponsorStage.REVIEW]: 4,
  [SponsorStage.UNDER_VERIFICATION]: 7,
  [SponsorStage.NEXT_LISTING]: 8,
  [SponsorStage.NEW_SPONSOR]: 9,
};

const OLDEST_FIRST: Record<SponsorStage, boolean> = {
  [SponsorStage.REVIEW_URGENT]: true,
  [SponsorStage.PAYMENT_PENDING]: true,
  [SponsorStage.REVIEW]: true,
  [SponsorStage.UNDER_VERIFICATION]: false,
  [SponsorStage.NEXT_LISTING]: false,
  [SponsorStage.NEW_SPONSOR]: false,
};

// The most pressing stage: by priority (a payment reminder older than a
// week drops behind everything but itself), then by date.
function pick(staged: ReadonlyArray<Staged>, now: Date): Staged | null {
  if (staged.length === 0) return null;
  const hasOthers = staged.some(
    (item) => item.stage !== SponsorStage.PAYMENT_PENDING,
  );
  const ranked = staged.map((item) => {
    let priority = PRIORITY[item.stage];
    if (
      item.stage === SponsorStage.PAYMENT_PENDING &&
      hasOthers &&
      dayjs(now).diff(item.sortDate, 'day') > PAYMENT_REMINDER_MAX_DAYS
    ) {
      priority = 8;
    }
    return { ...item, priority };
  });
  ranked.sort((a, b) => {
    const byPriority = a.priority - b.priority;
    if (byPriority !== 0) return byPriority;
    const byDate = dayjs(a.sortDate).diff(dayjs(b.sortDate));
    return OLDEST_FIRST[a.stage] ? byDate : -byDate;
  });
  return ranked[0] ?? null;
}

// Earn's stage rules over a sponsor's open or verifying listings: none at
// all is a new sponsor; an overdue winner announcement wins outright;
// otherwise the most pressing stage, or "post your next listing".
export function decideStage(
  listings: ReadonlyArray<StageListing>,
  unpaid: ReadonlySet<string>,
  now: Date,
): { readonly stage: SponsorStage; readonly listing: StageListing | null } {
  if (listings.length === 0) {
    return { stage: SponsorStage.NEW_SPONSOR, listing: null };
  }
  const staged = (listing: StageListing) =>
    stageOf(listing, unpaid.has(listing.id), now);
  const urgent = listings
    .filter(
      (listing) =>
        !!listing.commitmentDate &&
        dayjs(listing.commitmentDate).isBefore(dayjs(now)) &&
        isReviewable(listing),
    )
    .flatMap((listing) => staged(listing) ?? []);
  const chosen =
    pick(urgent, now) ??
    pick(
      listings.flatMap((listing) => staged(listing) ?? []),
      now,
    );
  return chosen
    ? { stage: chosen.stage, listing: chosen.listing }
    : { stage: SponsorStage.NEXT_LISTING, listing: null };
}

const Rewards = Schema.Record(Schema.String, Schema.Finite);

const iso = (date: Date | null) => (date ? date.toISOString() : undefined);

// As Earn's route sent it: dates as ISO strings, absent fields undefined.
function stageListingData(listing: StageListing): Listing {
  return {
    id: listing.id,
    title: listing.title,
    slug: listing.slug,
    type: listing.type,
    deadline: iso(listing.deadline),
    commitmentDate: iso(listing.commitmentDate),
    usdValue: listing.usdValue ?? undefined,
    publishedAt: iso(listing.publishedAt),
    winnersAnnouncedAt: iso(listing.winnersAnnouncedAt),
    status: listing.status,
    isPublished: listing.isPublished,
    isActive: listing.isActive,
    isArchived: listing.isArchived,
    isWinnersAnnounced: listing.isWinnersAnnounced,
    token: listing.token ?? undefined,
    rewardAmount: listing.rewardAmount ?? undefined,
    compensationType: listing.compensationType,
    minRewardAsk: listing.minRewardAsk ?? undefined,
    maxRewardAsk: listing.maxRewardAsk ?? undefined,
    rewards: Option.getOrUndefined(
      Schema.decodeUnknownOption(Rewards)(listing.rewards),
    ),
    maxBonusSpots: listing.maxBonusSpots ?? undefined,
    isFndnPaying: listing.isFndnPaying,
    region: listing.region,
    sponsorId: listing.sponsorId,
    sponsor: {
      name: listing.sponsor.name,
      slug: listing.sponsor.slug,
      logo: listing.sponsor.logo ?? '',
    },
  };
}

export class SponsorStages extends Context.Service<
  SponsorStages,
  {
    readonly stage: (
      sponsorId: string,
    ) => Effect.Effect<SponsorStageData, Database.DatabaseError>;
  }
>()('earn/SponsorStages') {}

const make = Effect.gen(function* () {
  const database = yield* Database.Database;

  const stage = Effect.fn('SponsorStages.stage')(function* (sponsorId: string) {
    const listings = yield* database.query('sponsorStageListings', (client) =>
      client.bounties.findMany({
        where: {
          sponsorId,
          OR: [
            {
              status: 'OPEN',
              isPublished: true,
              isActive: true,
              isArchived: false,
            },
            { status: 'VERIFYING', isArchived: false },
          ],
        },
        select: STAGE_LISTING,
      }),
    );
    const unpaid =
      listings.length === 0
        ? []
        : yield* database.query('sponsorStageUnpaid', (client) =>
            client.submission.groupBy({
              by: ['listingId'],
              where: {
                listingId: { in: listings.map((listing) => listing.id) },
                isWinner: true,
                isPaid: false,
              },
              _count: { id: true },
            }),
          );
    const now = new Date(yield* Clock.currentTimeMillis);
    const decided = decideStage(
      listings,
      new Set(
        unpaid.filter((row) => row._count.id > 0).map((row) => row.listingId),
      ),
      now,
    );
    const listing = decided.listing;
    const submissionCount = listing
      ? yield* database.query('sponsorStageSubmissions', (client) =>
          client.submission.count({
            where: { listingId: listing.id, isActive: true, isArchived: false },
          }),
        )
      : null;
    return {
      stage: decided.stage,
      listing: listing ? stageListingData(listing) : null,
      submissionCount,
    } satisfies SponsorStageData;
  });

  return SponsorStages.of({ stage });
});

export const layer = Layer.effect(SponsorStages, make);
