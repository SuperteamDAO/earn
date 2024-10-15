import type { NextApiResponse } from 'next';

import { BONUS_REWARD_POSITION } from '@/constants';
import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { fetchTokenUSDValue } from '@/utils/fetchTokenUSDValue';
import { filterAllowedFields } from '@/utils/filterAllowedFields';
import { safeStringify } from '@/utils/safeStringify';

const allowedFields = [
  'title',
  'hackathonSponsor',
  'pocId',
  'skills',
  'slug',
  'templateId',
  'pocSocials',
  'applicationType',
  'timeToComplete',
  'description',
  'type',
  'region',
  'referredBy',
  'references',
  'requirements',
  'rewardAmount',
  'rewards',
  'maxBonusSpots',
  'token',
  'compensationType',
  'minRewardAsk',
  'maxRewardAsk',
  'isPublished',
  'isPrivate',
  'isFndnPaying',
];

async function bounty(req: NextApiRequestWithUser, res: NextApiResponse) {
  const params = req.query;
  const id = params.id as string;
  logger.debug(`Request body: ${safeStringify(req.body)}`);
  const { hackathonSponsor, ...data } = req.body;

  const updatedData = filterAllowedFields(data, allowedFields);
  const {
    isPublished,
    compensationType,
    rewardAmount,
    token,
    maxRewardAsk,
    minRewardAsk,
    rewards,
  } = updatedData;

  let { maxBonusSpots } = updatedData;

  try {
    const userId = req.userId;

    const user = await prisma.user.findUnique({
      where: {
        id: userId as string,
      },
    });

    if (!user) {
      return res.status(403).json({ error: 'User does not exist.' });
    }

    if (Object.keys(updatedData).length === 0) {
      logger.warn(`No valid fields provided for update for user ID: ${userId}`);
      return res
        .status(400)
        .json({ error: 'No valid fields provided for update' });
    }

    const currentBounty = await prisma.bounties.findUnique({
      where: { id },
    });

    if (!currentBounty) {
      return res
        .status(404)
        .json({ message: `Bounty with id=${id} not found.` });
    }

    if (
      user.currentSponsorId !== currentBounty?.sponsorId &&
      user.hackathonId !== currentBounty.hackathonId
    ) {
      return res.status(403).json({
        error: 'User does not match the current sponsor or hackathon ID.',
      });
    }

    let publishedAt = currentBounty.publishedAt;
    if (isPublished && !currentBounty.publishedAt) {
      publishedAt = new Date();
    }

    if (
      currentBounty.maxBonusSpots > 0 &&
      typeof maxBonusSpots === 'undefined'
    ) {
      maxBonusSpots = 0;
    }

    const newRewardsCount = Object.keys(rewards || {}).length;
    const currentTotalWinners = currentBounty.totalWinnersSelected
      ? currentBounty.totalWinnersSelected - (maxBonusSpots ?? 0)
      : 0;

    if (newRewardsCount < currentTotalWinners) {
      updatedData.totalWinnersSelected = newRewardsCount;

      for (
        let position = newRewardsCount + 1;
        position <= currentTotalWinners;
        position++
      ) {
        logger.debug(
          `Resetting winner position: ${position} for listing ID: ${id}`,
        );
        await prisma.submission.updateMany({
          where: {
            listingId: id as string,
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

    if (maxBonusSpots < currentBounty.maxBonusSpots) {
      const bonusSubmissionsToUpdate = await prisma.submission.findMany({
        where: {
          listingId: id as string,
          isWinner: true,
          winnerPosition: BONUS_REWARD_POSITION,
        },
        select: { id: true },
        take: currentBounty.maxBonusSpots - maxBonusSpots,
      });
      await prisma.submission.updateMany({
        where: {
          id: {
            in: bonusSubmissionsToUpdate.map(({ id }) => id),
          },
          listingId: id as string,
          isWinner: true,
          winnerPosition: BONUS_REWARD_POSITION,
        },
        data: {
          isWinner: false,
          winnerPosition: null,
        },
      });
    }

    let usdValue = 0;
    let amount;
    if (isPublished && publishedAt) {
      try {
        if (compensationType === 'fixed') {
          amount = rewardAmount;
        } else if (compensationType === 'range') {
          amount = (maxRewardAsk + minRewardAsk) / 2;
        }
        if (token && amount) {
          const tokenUsdValue = await fetchTokenUSDValue(token, publishedAt);
          usdValue = tokenUsdValue * amount;
        }
      } catch (err) {
        logger.error('Error calculating USD value -', err);
      }
    }

    const sponsorId = hackathonSponsor;
    const result = await prisma.bounties.update({
      where: { id, sponsorId },
      data: {
        ...updatedData,
        sponsorId,
        usdValue,
        maxBonusSpots: maxBonusSpots || 0,
      },
    });

    logger.info(`Bounty with ID: ${id} updated successfully`);
    logger.debug(`Updated bounty data: ${safeStringify(result)}`);

    return res.status(200).json(result);
  } catch (error) {
    logger.error(
      `Error occurred while updating bounty with id=${id}: ${safeStringify(error)}`,
    );
    return res.status(400).json({
      error,
      message: `Error occurred while updating bounty with id=${id}.`,
    });
  }
}

export default withAuth(bounty);
