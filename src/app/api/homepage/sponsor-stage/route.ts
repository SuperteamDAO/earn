import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import { type Prisma } from '@/generated/prisma/client';
import { type Skills, skillsArraySchema } from '@/interface/skills';
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
  getEmailEstimate,
  getFeaturedAvailability,
} from '@/features/listing-builder/components/Form/Boost/server-queries';
import {
  amountToStep,
  getTotalImpressionsForValue,
} from '@/features/listing-builder/components/Form/Boost/utils';
import {
  type BountiesAi,
  type Listing,
  type ProjectApplicationAi,
  type Rewards,
} from '@/features/listings/types';

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
  token: true,
  rewardAmount: true,
  compensationType: true,
  minRewardAsk: true,
  maxRewardAsk: true,
  rewards: true,
  maxBonusSpots: true,
  isFndnPaying: true,
  sponsor: {
    select: {
      name: true,
      slug: true,
      logo: true,
    },
  },
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
  hasUncommittedProjectAiReviews: boolean,
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
    hasUnpaidWinners &&
    !listing.isFndnPaying
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
        : listing.type === 'project'
          ? hasUncommittedProjectAiReviews
          : false;

    if (hasAiReview) {
      return { stage: SponsorStage.REVIEW_AI, sortDate: deadline.toDate() };
    } else {
      return { stage: SponsorStage.REVIEW, sortDate: deadline.toDate() };
    }
  }

  if (listing.status === 'VERIFYING') {
    const verificationDate = listing.publishedAt
      ? dayjs(listing.publishedAt)
      : listing.updatedAt
        ? dayjs(listing.updatedAt)
        : now;
    return {
      stage: SponsorStage.UNDER_VERIFICATION,
      sortDate: verificationDate.toDate(),
    };
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

    const hasNextTierWithImpressions =
      nextStep &&
      usdValue < BOOST_THRESHOLD &&
      nextImpressions > currentImpressions;

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
    [SponsorStage.UNDER_VERIFICATION]: 7,
    [SponsorStage.NEXT_LISTING]: 8,
    [SponsorStage.NEW_SPONSOR]: 9,
  };

  const showOldestFirst: Record<SponsorStage, boolean> = {
    [SponsorStage.REVIEW_URGENT]: true,
    [SponsorStage.PAYMENT_PENDING]: true,
    [SponsorStage.REVIEW_AI]: true,
    [SponsorStage.REVIEW]: true,
    [SponsorStage.BOOST]: false,
    [SponsorStage.BOOSTED]: false,
    [SponsorStage.UNDER_VERIFICATION]: false,
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
    status: listing.status ?? undefined,
    isPublished: listing.isPublished ?? undefined,
    isActive: listing.isActive ?? undefined,
    isArchived: listing.isArchived ?? undefined,
    isWinnersAnnounced: listing.isWinnersAnnounced ?? undefined,
    token: listing.token ?? undefined,
    rewardAmount: listing.rewardAmount ?? undefined,
    compensationType: listing.compensationType ?? undefined,
    minRewardAsk: listing.minRewardAsk ?? undefined,
    maxRewardAsk: listing.maxRewardAsk ?? undefined,
    rewards: listing.rewards as Rewards | undefined,
    maxBonusSpots: listing.maxBonusSpots ?? undefined,
    isFndnPaying: listing.isFndnPaying ?? undefined,
    skills: listing.skills as Skills | undefined,
    region: listing.region ?? undefined,
    sponsorId: listing.sponsorId ?? undefined,
    sponsor: listing.sponsor
      ? {
          name: listing.sponsor.name,
          slug: listing.sponsor.slug,
          logo: listing.sponsor.logo ?? undefined,
        }
      : undefined,
  };
}

export async function GET(_request: NextRequest) {
  const apiStartTime = performance.now();

  try {
    const authStartTime = performance.now();
    const headersList = await headers();
    const sessionResponse = await getUserSession(headersList);
    const authEndTime = performance.now();

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

    const userQueryStartTime = performance.now();
    const user = await prisma.user.findUnique({
      where: { privyDid },
      select: { currentSponsorId: true },
    });
    const userQueryEndTime = performance.now();

    if (!user || !user.currentSponsorId) {
      logger.info('User has no currentSponsorId, returning null stage');
      return NextResponse.json({
        stage: null,
        listing: null,
      } as SponsorStageResponse);
    }

    const listingsQueryStartTime = performance.now();
    const listings = await prisma.bounties.findMany({
      where: {
        sponsorId: user.currentSponsorId,
        OR: [
          {
            status: 'OPEN',
            isPublished: true,
            isActive: true,
          },
          {
            status: 'VERIFYING',
          },
        ],
      },
      select: listingSelectForStage,
    });
    const listingsQueryEndTime = performance.now();

    if (listings.length === 0) {
      logger.info('Sponsor has no listings, returning NEW_SPONSOR stage');
      return NextResponse.json({
        stage: SponsorStage.NEW_SPONSOR,
        listing: null,
      } as SponsorStageResponse);
    }

    const listingIds = listings.map((l) => l.id);
    const unpaidWinnersMap = new Map<string, boolean>();
    const uncommittedProjectAiReviewsMap = new Map<string, boolean>();
    const projectListings = listings.filter((l) => l.type === 'project');
    const projectListingIds = projectListings.map((l) => l.id);

    const parallelQueriesStartTime = performance.now();
    const [unpaidWinners, projectSubmissions, isFeatureAvailable] =
      await Promise.all([
        prisma.submission.groupBy({
          by: ['listingId'],
          where: {
            listingId: { in: listingIds },
            isWinner: true,
            isPaid: false,
          },
          _count: { id: true },
        }),
        projectListingIds.length > 0
          ? prisma.submission.findMany({
              where: {
                listingId: { in: projectListingIds },
                status: 'Pending',
                label: {
                  in: ['Unreviewed', 'Pending'],
                },
              },
              select: {
                listingId: true,
                ai: true,
              },
            })
          : Promise.resolve([]),
        getFeaturedAvailability(),
      ]);
    const parallelQueriesEndTime = performance.now();

    unpaidWinners.forEach((item) => {
      if (item._count.id > 0) {
        unpaidWinnersMap.set(item.listingId, true);
      }
    });

    projectSubmissions.forEach((submission) => {
      const aiData = submission.ai as ProjectApplicationAi | null;
      if (aiData?.review?.predictedLabel && !aiData.commited) {
        uncommittedProjectAiReviewsMap.set(submission.listingId, true);
      }
    });

    const emailEstimateStartTime = performance.now();
    const emailEstimateCache = new Map<string, number>();
    const estimatePromises: Promise<void>[] = [];
    const seenEstimates = new Set<string>();
    const urgentListingIds: string[] = [];
    const now = dayjs();

    for (const listing of listings) {
      const commitmentDate = listing.commitmentDate
        ? dayjs(listing.commitmentDate)
        : null;
      if (
        commitmentDate &&
        commitmentDate.isBefore(now) &&
        !listing.isWinnersAnnounced
      ) {
        urgentListingIds.push(listing.id);
      }

      const isActiveListing =
        listing.isPublished &&
        listing.isActive &&
        !listing.isArchived &&
        listing.deadline &&
        dayjs(listing.deadline).isAfter(now);

      if (isActiveListing && listing.skills && Array.isArray(listing.skills)) {
        try {
          const validatedSkills = skillsArraySchema.parse(listing.skills);
          if (validatedSkills.length > 0) {
            const sortedSkills = validatedSkills.sort().join(',');
            const cacheKey = `${sortedSkills}|${listing.region || 'GLOBAL'}`;

            if (!seenEstimates.has(cacheKey)) {
              seenEstimates.add(cacheKey);
              estimatePromises.push(
                getEmailEstimate(validatedSkills, listing.region)
                  .then((estimate) => {
                    emailEstimateCache.set(cacheKey, estimate);
                  })
                  .catch((error) => {
                    logger.warn('Failed to get email estimate', {
                      skills: validatedSkills,
                      region: listing.region,
                      error:
                        error instanceof Error
                          ? error.message
                          : 'Unknown error',
                    });
                    emailEstimateCache.set(cacheKey, DEFAULT_EMAIL_IMPRESSIONS);
                  }),
              );
            }
          }
        } catch (error) {}
      }
    }

    await Promise.all(estimatePromises);
    const emailEstimateEndTime = performance.now();

    const processListing = (listing: BountyWithStageFields) => {
      const hasUnpaidWinners = unpaidWinnersMap.get(listing.id) || false;
      const hasUncommittedProjectAiReviews =
        uncommittedProjectAiReviewsMap.get(listing.id) || false;

      let emailImpressions = DEFAULT_EMAIL_IMPRESSIONS;
      if (listing.skills && Array.isArray(listing.skills)) {
        try {
          const validatedSkills = skillsArraySchema.parse(listing.skills);
          if (validatedSkills.length > 0) {
            const sortedSkills = validatedSkills.sort().join(',');
            const cacheKey = `${sortedSkills}|${listing.region || 'GLOBAL'}`;

            const estimate = emailEstimateCache.get(cacheKey);
            if (estimate !== undefined && estimate > 0) {
              const roundedEstimate = Math.round(estimate / 1000) * 1000;
              emailImpressions = Math.max(
                roundedEstimate,
                DEFAULT_EMAIL_IMPRESSIONS,
              );
            }
          }
        } catch (error) {}
      }

      return determineSponsorStage(
        listing,
        hasUnpaidWinners,
        hasUncommittedProjectAiReviews,
        isFeatureAvailable,
        emailImpressions,
      );
    };

    const processingStartTime = performance.now();
    const listingsWithStages: ListingWithStage[] = [];

    const urgentListings: ListingWithStage[] = [];

    const listingsMap = new Map(listings.map((l) => [l.id, l]));

    for (const listingId of urgentListingIds) {
      const listing = listingsMap.get(listingId);
      if (listing) {
        const stageData = processListing(listing);
        if (stageData) {
          urgentListings.push({
            listing,
            stage: stageData.stage,
            sortDate: stageData.sortDate,
          });
        }
      }
    }

    if (urgentListings.length > 0) {
      const processingEndTime = performance.now();

      const selectedListing = applyPriorityAndTiebreaker(urgentListings);
      if (selectedListing) {
        const response: SponsorStageResponse = {
          stage: selectedListing.stage,
          listing: formatListingData(selectedListing.listing),
        };

        const totalTime = performance.now() - apiStartTime;
        logger.info('Sponsor stage determined (urgent early exit)', {
          stage: response.stage,
          listingId: response.listing?.id,
          sponsorId: user.currentSponsorId,
          performanceMs: {
            total: Math.round(totalTime),
            auth: Math.round(authEndTime - authStartTime),
            userQuery: Math.round(userQueryEndTime - userQueryStartTime),
            listingsQuery: Math.round(
              listingsQueryEndTime - listingsQueryStartTime,
            ),
            parallelQueries: Math.round(
              parallelQueriesEndTime - parallelQueriesStartTime,
            ),
            emailEstimates: Math.round(
              emailEstimateEndTime - emailEstimateStartTime,
            ),
            processing: Math.round(processingEndTime - processingStartTime),
          },
          stats: {
            totalListings: listings.length,
            urgentListings: urgentListings.length,
            emailEstimatesCached: emailEstimateCache.size,
          },
        });

        return NextResponse.json(response);
      }
    }

    for (const listing of listings) {
      const stageData = processListing(listing);

      if (stageData) {
        listingsWithStages.push({
          listing,
          stage: stageData.stage,
          sortDate: stageData.sortDate,
        });
      }
    }
    const processingEndTime = performance.now();

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

    const totalTime = performance.now() - apiStartTime;
    logger.info('Sponsor stage determined successfully', {
      stage: response.stage,
      listingId: response.listing?.id,
      sponsorId: user.currentSponsorId,
      performanceMs: {
        total: Math.round(totalTime),
        auth: Math.round(authEndTime - authStartTime),
        userQuery: Math.round(userQueryEndTime - userQueryStartTime),
        listingsQuery: Math.round(
          listingsQueryEndTime - listingsQueryStartTime,
        ),
        parallelQueries: Math.round(
          parallelQueriesEndTime - parallelQueriesStartTime,
        ),
        emailEstimates: Math.round(
          emailEstimateEndTime - emailEstimateStartTime,
        ),
        processing: Math.round(processingEndTime - processingStartTime),
      },
      stats: {
        totalListings: listings.length,
        processedListings: listingsWithStages.length,
        emailEstimatesCached: emailEstimateCache.size,
      },
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
