import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import { getEmailEstimate } from '@/app/api/sponsor-dashboard/listing/email-estimate/route';
import { getFeaturedAvailability } from '@/app/api/sponsor-dashboard/listing/featured-posts/route';
import { type Prisma } from '@/generated/prisma/client';
import { skillsArraySchema } from '@/interface/skills';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { dayjs } from '@/utils/dayjs';
import { safeStringify } from '@/utils/safeStringify';

import { getUserSession } from '@/features/auth/utils/getUserSession';
import {
  SponsorStage,
  type SponsorStageResponse,
} from '@/features/home/types/sponsor-stage';
import {
  BOOST_STEP_TO_AMOUNT_USD,
  BOOST_STEPS,
  DEFAULT_EMAIL_IMPRESSIONS,
} from '@/features/listing-builder/components/Form/Boost/constants';
import {
  amountToStep,
  getTotalImpressionsForValue,
} from '@/features/listing-builder/components/Form/Boost/utils';
import { type BountiesAi, type Listing } from '@/features/listings/types';

const PAYMENT_REMINDER_MAX_DAYS = 7;

const BOOST_THRESHOLD =
  BOOST_STEP_TO_AMOUNT_USD[BOOST_STEPS[BOOST_STEPS.length - 1]!];

const listingSelectForStage = {
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
  ai: true,
  updatedAt: true,
  skills: true,
  region: true,
  sponsorId: true,
} satisfies Prisma.BountiesSelect;

type BountyWithStageFields = Prisma.BountiesGetPayload<{
  select: typeof listingSelectForStage;
}>;

interface ListingWithStage {
  listing: BountyWithStageFields;
  stage: SponsorStage;
  sortDate: Date;
}

function determineSponsorStage(
  listing: BountyWithStageFields,
  hasUnpaidWinners: boolean,
  isFeatureAvailable: boolean,
  emailImpressions: number,
): { stage: SponsorStage; sortDate: Date } | null {
  const now = dayjs();
  const deadline = listing.deadline ? dayjs(listing.deadline) : null;
  const commitmentDate = listing.commitmentDate
    ? dayjs(listing.commitmentDate)
    : null;

  if (
    commitmentDate &&
    commitmentDate.isBefore(now) &&
    !listing.isWinnersAnnounced
  ) {
    return {
      stage: SponsorStage.REVIEW_URGENT,
      sortDate: commitmentDate.toDate(),
    };
  }

  if (
    listing.isWinnersAnnounced &&
    listing.type === 'bounty' &&
    hasUnpaidWinners
  ) {
    const announceDate = listing.winnersAnnouncedAt
      ? dayjs(listing.winnersAnnouncedAt)
      : now;
    return {
      stage: SponsorStage.PAYMENT_PENDING,
      sortDate: announceDate.toDate(),
    };
  }

  if (deadline && deadline.isBefore(now) && !listing.isWinnersAnnounced) {
    const hasAiReview =
      listing.type === 'bounty'
        ? (listing.ai as BountiesAi)?.evaluationCompleted === true
        : false;

    if (hasAiReview) {
      return { stage: SponsorStage.REVIEW_AI, sortDate: deadline.toDate() };
    } else {
      return { stage: SponsorStage.REVIEW, sortDate: deadline.toDate() };
    }
  }

  const isActiveListing =
    listing.isPublished &&
    listing.isActive &&
    !listing.isArchived &&
    deadline &&
    (deadline.isAfter(now) || deadline.isSame(now));

  if (isActiveListing) {
    const usdValue = listing.usdValue || 0;
    const publishedDate = listing.publishedAt
      ? dayjs(listing.publishedAt)
      : now;

    const currentStep = amountToStep(usdValue, isFeatureAvailable);
    const allSteps = [...BOOST_STEPS];
    const currentStepIndex = allSteps.indexOf(currentStep);
    const nextStep = allSteps[currentStepIndex + 1];

    const currentImpressions = getTotalImpressionsForValue(
      currentStep,
      emailImpressions,
      isFeatureAvailable,
    );
    const nextImpressions = nextStep
      ? getTotalImpressionsForValue(
          nextStep,
          emailImpressions,
          isFeatureAvailable,
        )
      : 0;

    console.log('Boost stage determination', {
      listingId: listing.id,
      usdValue,
      currentStep,
      nextStep,
      isFeatureAvailable,
      emailImpressions,
      currentImpressions,
      nextImpressions,
      boostThreshold: BOOST_THRESHOLD,
      impressionDifference: nextImpressions - currentImpressions,
    });

    const hasNextTierWithImpressions =
      nextStep &&
      usdValue < BOOST_THRESHOLD &&
      nextImpressions > currentImpressions;

    logger.info('Boost stage decision', {
      listingId: listing.id,
      hasNextTierWithImpressions,
      stage: hasNextTierWithImpressions
        ? SponsorStage.BOOST
        : SponsorStage.BOOSTED,
    });

    if (hasNextTierWithImpressions) {
      return {
        stage: SponsorStage.BOOST,
        sortDate: publishedDate.toDate(),
      };
    } else {
      return {
        stage: SponsorStage.BOOSTED,
        sortDate: publishedDate.toDate(),
      };
    }
  }

  if (listing.isArchived || listing.status === 'CLOSED') {
    const completionDate = listing.winnersAnnouncedAt
      ? dayjs(listing.winnersAnnouncedAt)
      : listing.updatedAt
        ? dayjs(listing.updatedAt)
        : now;
    return {
      stage: SponsorStage.NEXT_LISTING,
      sortDate: completionDate.toDate(),
    };
  }

  return null;
}

function applyPriorityAndTiebreaker(
  listingsWithStages: ListingWithStage[],
): ListingWithStage | null {
  if (listingsWithStages.length === 0) return null;

  const now = dayjs();

  const stagePriority: Record<SponsorStage, number> = {
    [SponsorStage.REVIEW_URGENT]: 1,
    [SponsorStage.PAYMENT_PENDING]: 2,
    [SponsorStage.REVIEW_AI]: 3,
    [SponsorStage.REVIEW]: 4,
    [SponsorStage.BOOST]: 5,
    [SponsorStage.BOOSTED]: 6,
    [SponsorStage.NEXT_LISTING]: 7,
    [SponsorStage.NEW_SPONSOR]: 8,
  };

  const showOldestFirst: Record<SponsorStage, boolean> = {
    [SponsorStage.REVIEW_URGENT]: true,
    [SponsorStage.PAYMENT_PENDING]: true,
    [SponsorStage.REVIEW_AI]: true,
    [SponsorStage.REVIEW]: true,
    [SponsorStage.BOOST]: false,
    [SponsorStage.BOOSTED]: false,
    [SponsorStage.NEXT_LISTING]: false,
    [SponsorStage.NEW_SPONSOR]: false,
  };

  const hasOtherStages = listingsWithStages.some(
    (item) => item.stage !== SponsorStage.PAYMENT_PENDING,
  );

  const listingsWithPriority = listingsWithStages.map((item) => {
    let effectivePriority = stagePriority[item.stage];

    if (item.stage === SponsorStage.PAYMENT_PENDING && hasOtherStages) {
      const daysSinceAnnouncement = now.diff(item.sortDate, 'day');

      if (daysSinceAnnouncement > PAYMENT_REMINDER_MAX_DAYS) {
        effectivePriority = 8;
      }
    }

    return { ...item, effectivePriority };
  });

  const sorted = listingsWithPriority.sort((a, b) => {
    const priorityDiff = a.effectivePriority - b.effectivePriority;

    if (priorityDiff !== 0) return priorityDiff;

    const oldestFirst = showOldestFirst[a.stage];
    const dateDiff = dayjs(a.sortDate).diff(dayjs(b.sortDate));

    return oldestFirst ? dateDiff : -dateDiff;
  });

  return sorted[0] || null;
}

function formatListingData(listing: BountyWithStageFields): Listing {
  return {
    id: listing.id,
    title: listing.title,
    slug: listing.slug,
    type: listing.type,
    deadline: listing.deadline ? listing.deadline.toISOString() : undefined,
    commitmentDate: listing.commitmentDate
      ? listing.commitmentDate.toISOString()
      : undefined,
    usdValue: listing.usdValue ?? undefined,
    publishedAt: listing.publishedAt
      ? listing.publishedAt.toISOString()
      : undefined,
    winnersAnnouncedAt: listing.winnersAnnouncedAt
      ? listing.winnersAnnouncedAt.toISOString()
      : undefined,
  };
}

export async function GET(_request: NextRequest) {
  try {
    const headersList = await headers();
    const sessionResponse = await getUserSession(headersList);

    if (sessionResponse.status !== 200 || !sessionResponse.data) {
      logger.warn(
        `Authentication failed for sponsor-stage: ${sessionResponse.error}`,
      );
      return NextResponse.json(
        { error: sessionResponse.error },
        { status: sessionResponse.status },
      );
    }

    const { privyDid } = sessionResponse.data;

    const user = await prisma.user.findUnique({
      where: { privyDid },
      select: { currentSponsorId: true },
    });

    if (!user || !user.currentSponsorId) {
      logger.info('User has no currentSponsorId, returning null stage');
      return NextResponse.json({
        stage: null,
        listing: null,
      } as SponsorStageResponse);
    }

    const listings = await prisma.bounties.findMany({
      where: {
        sponsorId: user.currentSponsorId,
        status: 'OPEN',
        isPublished: true,
        isActive: true,
      },
      select: listingSelectForStage,
    });

    if (listings.length === 0) {
      logger.info('Sponsor has no listings, returning NEW_SPONSOR stage');
      return NextResponse.json({
        stage: SponsorStage.NEW_SPONSOR,
        listing: null,
      } as SponsorStageResponse);
    }

    const listingIds = listings.map((l) => l.id);
    const unpaidWinnersMap = new Map<string, boolean>();

    const unpaidWinners = await prisma.submission.groupBy({
      by: ['listingId'],
      where: {
        listingId: { in: listingIds },
        isWinner: true,
        isPaid: false,
      },
      _count: { id: true },
    });

    unpaidWinners.forEach((item) => {
      if (item._count.id > 0) {
        unpaidWinnersMap.set(item.listingId, true);
      }
    });

    const isFeatureAvailable = await getFeaturedAvailability();
    console.log('Featured availability', { isFeatureAvailable });

    const listingsWithStages: ListingWithStage[] = [];

    for (const listing of listings) {
      const hasUnpaidWinners = unpaidWinnersMap.get(listing.id) || false;

      let emailImpressions = DEFAULT_EMAIL_IMPRESSIONS;
      if (listing.skills && Array.isArray(listing.skills)) {
        try {
          const validatedSkills = skillsArraySchema.parse(listing.skills);
          if (validatedSkills.length > 0) {
            const estimate = await getEmailEstimate(
              validatedSkills,
              listing.region,
            );
            logger.info('Email estimate result', {
              listingId: listing.id,
              estimate,
            });
            // Round to nearest thousand, but always use at least the default
            if (estimate > 0) {
              const roundedEstimate = Math.round(estimate / 1000) * 1000;
              emailImpressions = Math.max(
                roundedEstimate,
                DEFAULT_EMAIL_IMPRESSIONS,
              );
            }
          }
        } catch (error) {
          logger.warn('Failed to get email estimate', {
            listingId: listing.id,
            error,
          });
        }
      }

      logger.info('Final email impressions', {
        listingId: listing.id,
        emailImpressions,
      });

      const stageData = determineSponsorStage(
        listing,
        hasUnpaidWinners,
        isFeatureAvailable,
        emailImpressions,
      );

      if (stageData) {
        listingsWithStages.push({
          listing,
          stage: stageData.stage,
          sortDate: stageData.sortDate,
        });
      }
    }

    const selectedListing = applyPriorityAndTiebreaker(listingsWithStages);

    if (!selectedListing) {
      logger.info('No trackable stage found, returning NEXT_LISTING');
      return NextResponse.json({
        stage: SponsorStage.NEXT_LISTING,
        listing: null,
      } as SponsorStageResponse);
    }

    const response: SponsorStageResponse = {
      stage: selectedListing.stage,
      listing: formatListingData(selectedListing.listing),
    };

    logger.info('Successfully determined sponsor stage', {
      stage: response.stage,
      listingId: response.listing?.id,
    });

    return NextResponse.json(response);
  } catch (error: unknown) {
    logger.error('Error occurred while determining sponsor stage', {
      error: safeStringify(error),
    });

    return NextResponse.json(
      { error: 'An error occurred while determining the sponsor stage' },
      { status: 500 },
    );
  }
}
