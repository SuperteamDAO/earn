import { franc } from 'franc';
import type { NextApiResponse } from 'next';

import {
  checkListingSponsorAuth,
  type NextApiRequestWithSponsor,
  withSponsorAuth,
} from '@/features/auth';
import { discordListingUpdate } from '@/features/discord';
import { sendEmailNotification } from '@/features/emails';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { dayjs } from '@/utils/dayjs';
import { fetchTokenUSDValue } from '@/utils/fetchTokenUSDValue';
import { filterAllowedFields } from '@/utils/filterAllowedFields';
import { safeStringify } from '@/utils/safeStringify';

const allowedFields = [
  'type',
  'title',
  'skills',
  'slug',
  'deadline',
  'templateId',
  'pocSocials',
  'applicationType',
  'timeToComplete',
  'description',
  'eligibility',
  'references',
  'region',
  'referredBy',
  'isPrivate',
  'requirements',
  'rewardAmount',
  'rewards',
  'token',
  'compensationType',
  'minRewardAsk',
  'maxRewardAsk',
  'isPublished',
];

async function bounty(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  const { id } = req.query;

  const data = req.body;
  const updatedData = filterAllowedFields(data, allowedFields);

  logger.debug(`Request query: ${safeStringify(req.query)}`);
  logger.debug(`Request body: ${safeStringify(req.body)}`);

  try {
    const userSponsorId = req.userSponsorId;

    const { error, listing } = await checkListingSponsorAuth(
      userSponsorId,
      id as string,
    );
    if (error) {
      return res.status(error.status).json({ error: error.message });
    }

    const {
      rewards,
      rewardAmount,
      token,
      maxRewardAsk,
      minRewardAsk,
      compensationType,
      isPublished,
      description,
    } = updatedData;

    let publishedAt = listing.publishedAt;
    if (isPublished && !listing.publishedAt) {
      publishedAt = new Date();
    }

    let language = '';
    if (description) {
      language = franc(description);
      // both 'eng' and 'sco' are english listings
    }

    const newRewardsCount = Object.keys(rewards || {}).length;
    const currentTotalWinners = listing.totalWinnersSelected || 0;

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

    const result = await prisma.bounties.update({
      where: { id: id as string },
      data: {
        ...updatedData,
        rewards,
        rewardAmount,
        token,
        maxRewardAsk,
        minRewardAsk,
        compensationType,
        isPublished,
        publishedAt,
        usdValue,
        language,
      },
      include: { sponsor: true },
    });

    try {
      if (listing.isPublished === true && result.isPublished === false) {
        await discordListingUpdate(result, 'Unpublished');
      }
      if (listing.isPublished === false && result.isPublished === true) {
        await discordListingUpdate(result, 'Published');
      }
    } catch (err) {
      logger.error('Discord Listing Update Message Error', err);
    }

    // listing email check
    logger.info(`Bounty with ID: ${id} updated successfully`);
    logger.debug(`Updated bounty data: ${safeStringify(result)}`);

    // const shouldSendEmail = await shouldSendEmailForListing(result);
    // if (listing.isPublished === false && shouldSendEmail) {
    //   logger.debug(`Sending email notification for listing creation`);
    //   await sendEmailNotification({
    //     type: 'createListing',
    //     id: id as string,
    //     triggeredBy: req.userId,
    //   });
    // }

    const deadlineChanged =
      listing.deadline?.toString() !== result.deadline?.toString();
    if (deadlineChanged && result.isPublished) {
      const dayjsDeadline = dayjs(result.deadline);
      logger.debug(
        `Creating comment for deadline extension for listing ID: ${result.id}`,
      );
      await prisma.comment.create({
        data: {
          message: `The deadline for this listing has been updated to ${dayjsDeadline.format('h:mm A, MMMM D, YYYY (UTC)')}`,
          listingId: result.id,
          authorId: result.pocId,
          type: 'DEADLINE_EXTENSION',
        },
      });
      logger.debug(`Sending email notification for deadline extension`);
      await sendEmailNotification({
        type: 'deadlineExtended',
        id: id as string,
        triggeredBy: req.userId,
      });
    }

    return res.status(200).json(result);
  } catch (error: any) {
    logger.error(
      `Error occurred while updating bounty with id=${id}: ${safeStringify(error)}`,
    );
    return res.status(400).json({
      error: error.message,
      message: `Error occurred while updating bounty with id=${id}.`,
    });
  }
}

export default withSponsorAuth(bounty);
