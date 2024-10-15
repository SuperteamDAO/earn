import { franc } from 'franc';
import type { NextApiResponse } from 'next';

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
      applicationType,
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
      isFndnPaying,
    } = req.body;
    let { isPublished } = req.body;

    let publishedAt;
    if (isPublished) {
      publishedAt = new Date();
    }

    let language = '';
    if (description) {
      language = franc(description);
      // both 'eng' and 'sco' are english listings
    } else {
      language = 'eng';
    }

    const correctedSkills = cleanSkills(skills);

    let usdValue = 0;
    if (isPublished && publishedAt) {
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

    let isVerifying = false;

    if (isPublished) {
      const sponsor = await prisma.sponsors.findUnique({
        where: { id: userSponsorId },
        select: { isCaution: true, isVerified: true },
      });

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
          const latestBounty = await prisma.bounties.findFirst({
            where: {
              sponsorId: userSponsorId,
              isArchived: false,
              isPublished: true,
              status: 'OPEN',
            },
            orderBy: { deadline: 'desc' },
            select: { deadline: true, isWinnersAnnounced: true },
          });

          if (latestBounty && !latestBounty.isWinnersAnnounced) {
            const twoWeeksAgo = dayjs().subtract(2, 'weeks');
            isVerifying = dayjs(latestBounty.deadline).isBefore(twoWeeksAgo);
          }
        }
      }
    }

    if (isVerifying) {
      isPublished = false;
      publishedAt = null;
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
      applicationType,
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
