// used for api route, dont add use client here.
import logger from '@/lib/logger';
import { prisma } from '@/prisma';

import { BONUS_REWARD_POSITION } from '@/features/listing-builder/constants';

import { type ListingFormData } from '../types';
import { calculateTotalPrizes } from './rewards';

async function resetExcessWinners(
  listingId: string,
  newRewardsCount: number,
): Promise<void> {
  const currentTotalWinners = await prisma.submission.count({
    where: {
      listingId,
      isWinner: true,
      winnerPosition: {
        gt: 0,
        not: BONUS_REWARD_POSITION,
      },
    },
  });

  if (newRewardsCount >= currentTotalWinners) {
    logger.info('No regular winners need to be reset', {
      listingId,
      newRewardsCount,
      currentTotalWinners,
    });
    return;
  }

  logger.info(
    'Attempting to reset selected winners since new total winners are less than previous',
    {
      listingId,
      newRewardsCount,
      currentTotalWinners,
    },
  );

  for (
    let position = newRewardsCount + 1;
    position <= currentTotalWinners;
    position++
  ) {
    logger.debug(
      `Resetting winner position: ${position} for listing ID: ${listingId}`,
    );

    await prisma.submission.updateMany({
      where: {
        listingId,
        isWinner: true,
        winnerPosition: position,
      },
      data: {
        isWinner: false,
        winnerPosition: null,
      },
    });
  }
}

async function resetExcessBonusWinners(
  listingId: string,
  maxBonusSpots: number,
): Promise<void> {
  const currentBonusWinners = await prisma.submission.count({
    where: {
      listingId,
      isWinner: true,
      winnerPosition: BONUS_REWARD_POSITION,
    },
  });

  if (currentBonusWinners <= maxBonusSpots) {
    logger.info('No bonus submissions need to be reset', {
      listingId,
      currentBonusWinners,
      maxBonusSpots,
    });
    return;
  }

  const submissionsToReset = currentBonusWinners - maxBonusSpots;

  logger.info(
    'Attempting to reset selected bonus winners since current bonus winners exceed new limit',
    {
      listingId,
      currentBonusWinners,
      maxBonusSpots,
      submissionsToReset,
    },
  );

  const bonusSubmissionsToUpdate = await prisma.submission.findMany({
    where: {
      listingId,
      isWinner: true,
      winnerPosition: BONUS_REWARD_POSITION,
    },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
    take: submissionsToReset,
  });

  logger.info('Updating the following bonus winner selected submissions', {
    listingId,
    bonusSubmissionsToUpdate,
    submissionsToReset,
  });

  await prisma.submission.updateMany({
    where: {
      id: {
        in: bonusSubmissionsToUpdate.map(({ id }) => id),
      },
      listingId,
      isWinner: true,
      winnerPosition: BONUS_REWARD_POSITION,
    },
    data: {
      isWinner: false,
      winnerPosition: null,
    },
  });
}

interface WinnerResetParams {
  listingId: string;
  validatedListing: ListingFormData;
}

export async function handleWinnerResets({
  listingId,
  validatedListing,
}: WinnerResetParams): Promise<void> {
  const { rewards, maxBonusSpots } = validatedListing;

  const newRewardsCount = calculateTotalPrizes(rewards, 0);
  const newMaxBonusSpots = maxBonusSpots ?? 0;

  await resetExcessWinners(listingId, newRewardsCount);
  await resetExcessBonusWinners(listingId, newMaxBonusSpots);
}
