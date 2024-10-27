import { franc } from 'franc';
import type { NextApiResponse } from 'next';

import { BONUS_REWARD_POSITION } from '@/constants';
import {
  type NextApiRequestWithSponsor,
  withSponsorAuth,
} from '@/features/auth';
import earncognitoClient from '@/lib/earncognitoClient';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { cleanSkills } from '@/utils/cleanSkills';
import { dayjs } from '@/utils/dayjs';
import { fetchTokenUSDValue } from '@/utils/fetchTokenUSDValue';
import { safeStringify } from '@/utils/safeStringify';

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  const userId = req.userId;
  const userSponsorId = req.userSponsorId;

  if (!userSponsorId) {
    logger.warn('Invalid token: User Sponsor Id is missing');
    return res.status(400).json({ error: 'Invalid token' });
  }

  logger.debug(`Request body: ${safeStringify(req.body)}`);

  try {
    const {
      title,
      pocId,
      skills,
      slug,
      deadline,
      templateId,
      pocSocials,
      timeToComplete,
      description,
      type,
      region,
      referredBy,
      eligibility,
      references,
      requirements,
      rewardAmount,
      rewards,
      maxBonusSpots,
      token,
      compensationType,
      minRewardAsk,
      maxRewardAsk,
      isPrivate,
      status,
    } = req.body;
    let { isPublished } = req.body;

    let publishedAt;
    let language = '';

    if (description) {
      language = franc(description);
      // both 'eng' and 'sco' are english listings
    } else {
      language = 'eng';
    }

    const correctedSkills = cleanSkills(skills);

    let isVerifying = false;

    const sponsor = await prisma.sponsors.findUnique({
      where: { id: userSponsorId },
      select: { isCaution: true, isVerified: true, st: true },
    });

    const isFndnPaying =
      sponsor?.st && type !== 'project' ? req.body.isFndnPaying : false;

    if (isPublished) {
      publishedAt = new Date();

      if (!token) {
        return res.status(400).json({ error: 'Please select a valid token' });
      }

      if (type === 'project') {
        if (!compensationType) {
          return res
            .status(400)
            .json({ error: 'Please add a compensation type' });
        }

        if (compensationType === 'fixed' && !rewardAmount) {
          return res.status(400).json({
            error: 'Please specify the total reward amount to proceed',
          });
        }

        if (compensationType === 'range') {
          if (!minRewardAsk || !maxRewardAsk) {
            return res.status(400).json({
              error:
                'Please specify your preferred minimum and maximum compensation range',
            });
          }
          if (maxRewardAsk <= minRewardAsk) {
            return res.status(400).json({
              error:
                'The compensation range is incorrect; the maximum must be higher than the minimum',
            });
          }
        }
      } else {
        if (maxBonusSpots !== undefined) {
          if (maxBonusSpots > 50) {
            return res.status(400).json({
              error: 'Maximum number of bonus prizes allowed is 50',
            });
          }
          if (maxBonusSpots === 0) {
            return res.status(400).json({
              error: "# of bonus prizes can't be 0",
            });
          }

          if (
            maxBonusSpots > 0 &&
            (!rewards?.[BONUS_REWARD_POSITION] ||
              isNaN(rewards[BONUS_REWARD_POSITION]))
          ) {
            return res.status(400).json({
              error: 'Bonus Reward is not mentioned',
            });
          }
        }

        if (rewards?.[BONUS_REWARD_POSITION] !== undefined) {
          if (rewards[BONUS_REWARD_POSITION] === 0) {
            return res.status(400).json({
              error: "Bonus per prize can't be 0",
            });
          }
          if (rewards[BONUS_REWARD_POSITION] < 0.01) {
            return res.status(400).json({
              error: "Bonus per prize can't be less than 0.01",
            });
          }
        }

        const prizePositions = Object.keys(rewards || {})
          .filter((key) => key !== BONUS_REWARD_POSITION.toString())
          .map(Number);

        for (let i = 1; i <= prizePositions.length; i++) {
          if (!prizePositions.includes(i) || !rewards[i] || isNaN(rewards[i])) {
            return res.status(400).json({
              error: 'Please fill all podium ranks or remove unused',
            });
          }
        }
      }

      if (sponsor) {
        // sponsor is sus, be caution
        isVerifying = sponsor.isCaution;

        if (!isVerifying) {
          // sponsor never had a live listing
          const bountyCount = await prisma.bounties.count({
            where: {
              sponsorId: userSponsorId,
              isArchived: false,
              isPublished: true,
              isActive: true,
            },
          });
          isVerifying = bountyCount === 0;
        }

        // sponsor is unverified and latest listing is in review for more than 2 weeks
        if (!isVerifying && !sponsor.isVerified) {
          const twoWeeksAgo = dayjs().subtract(2, 'weeks');

          const overdueBounty = await prisma.bounties.findFirst({
            select: {
              id: true,
            },
            where: {
              sponsorId: userSponsorId,
              isArchived: false,
              isPublished: true,
              isActive: true,
              isWinnersAnnounced: false,
              deadline: {
                lt: twoWeeksAgo.toDate(),
              },
            },
          });

          isVerifying = !!overdueBounty;
        }
      }
    }

    if (isVerifying) {
      isPublished = false;
      publishedAt = null;
    }

    let usdValue = 0;
    if (isPublished && publishedAt && !isVerifying) {
      try {
        let amount;
        if (compensationType === 'fixed') {
          amount = rewardAmount;
        } else if (compensationType === 'range') {
          amount = (minRewardAsk + maxRewardAsk) / 2;
        }

        if (amount && token) {
          const tokenUsdValue = await fetchTokenUSDValue(token, publishedAt);
          usdValue = tokenUsdValue * amount;
        }
      } catch (error) {
        logger.error('Error calculating USD value:', error);
      }
    }

    const finalData = {
      sponsorId: userSponsorId,
      status,
      title,
      usdValue,
      publishedAt,
      pocId,
      skills: correctedSkills,
      slug,
      deadline,
      templateId,
      pocSocials,
      timeToComplete,
      description,
      type,
      region,
      referredBy,
      eligibility,
      references,
      requirements,
      rewardAmount,
      rewards,
      maxBonusSpots,
      token,
      compensationType,
      minRewardAsk,
      maxRewardAsk,
      isPublished,
      isPrivate,
      language,
      isFndnPaying,
    };

    logger.debug(`Creating bounty with data: ${safeStringify(finalData)}`);
    const result = await prisma.bounties.create({
      data: {
        ...finalData,
        status: isVerifying ? 'VERIFYING' : status || 'OPEN',
      },
    });

    if (isVerifying) {
      try {
        if (!process.env.EARNCOGNITO_URL) {
          throw new Error('ENV EARNCOGNITO_URL not provided');
        }
        await earncognitoClient.post(`/discord/verify-listing/initiate`, {
          listingId: result.id,
        });
      } catch (err) {
        console.log('Failed to send Verification Message to discord', err);
        logger.error('Failed to send Verification Message to discord', err);
      }
    } else {
      try {
        await earncognitoClient.post(`/discord/listing-update`, {
          listingId: result?.id,
          status: result.isPublished
            ? 'Published'
            : isVerifying
              ? 'To be Verified'
              : 'Draft Added',
        });
      } catch (err) {
        logger.error('Discord Listing Update Message Error', err);
      }
    }
    logger.info(`Bounty created successfully with ID: ${result.id}`);
    logger.debug(`Created bounty data: ${safeStringify(result)}`);

    return res.status(200).json(result);
  } catch (error: any) {
    logger.error(
      `User ${userId} unable to create a listing: ${safeStringify(error)}`,
    );
    return res.status(400).json({
      error: error.message,
      message: 'Error occurred while adding a new bounty.',
    });
  }
}

export default withSponsorAuth(handler);
