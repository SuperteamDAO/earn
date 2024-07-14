import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { discordListingUpdate } from '@/features/discord';
import { sendEmailNotification } from '@/features/emails';
import { shouldSendEmailForListing } from '@/features/listing-builder';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { fetchTokenUSDValue } from '@/utils/fetchTokenUSDValue';
import { safeStringify } from '@/utils/safeStringify';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;

  logger.debug(`Request body: ${safeStringify(req.body)}`);

  try {
    logger.debug(`Fetching user with ID: ${userId}`);
    const user = await prisma.user.findUnique({
      where: { id: userId as string },
    });

    if (!user || !user.currentSponsorId) {
      logger.warn('User does not have a current sponsor or is unauthorized');
      return res
        .status(403)
        .json({ error: 'User does not have a current sponsor.' });
    }

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
      token,
      compensationType,
      minRewardAsk,
      maxRewardAsk,
      isPublished,
      isPrivate,
    } = req.body;
    let usdValue = 0;

    let publishedAt;
    if (isPublished) {
      publishedAt = new Date();
    }

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

    const finalData = {
      sponsorId: user.currentSponsorId,
      title,
      usdValue,
      publishedAt,
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
      token,
      compensationType,
      minRewardAsk,
      maxRewardAsk,
      isPublished,
      isPrivate,
    };

    logger.debug(`Creating bounty with data: ${safeStringify(finalData)}`);
    const result = await prisma.bounties.create({
      data: finalData,
      include: { sponsor: true },
    });

    try {
      await discordListingUpdate(
        result,
        result.isPublished ? 'Published' : 'Draft Added',
      );
    } catch (err) {
      logger.error('Discord Listing Update Message Error', err);
    }
    logger.info(`Bounty created successfully with ID: ${result.id}`);
    logger.debug(`Created bounty data: ${safeStringify(result)}`);

    const shouldSendEmail = await shouldSendEmailForListing(result);
    if (shouldSendEmail) {
      logger.debug('Sending email notification for new listing creation');
      await sendEmailNotification({
        type: 'createListing',
        id: result.id,
        triggeredBy: userId,
      });
    }

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

export default withAuth(handler);
