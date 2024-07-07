import axios from 'axios';
import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { discordListingUpdate } from '@/features/discord';
import { sendEmailNotification } from '@/features/emails';
import { shouldSendEmailForListing } from '@/features/listing-builder';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { dayjs } from '@/utils/dayjs';
import { fetchTokenUSDValue } from '@/utils/fetchTokenUSDValue';
import { safeStringify } from '@/utils/safeStringify';

async function bounty(req: NextApiRequestWithUser, res: NextApiResponse) {
  const { id } = req.query;
  const updatedData = req.body;

  logger.debug(`Request query: ${safeStringify(req.query)}`);
  logger.debug(`Request body: ${safeStringify(req.body)}`);

  try {
    const userId = req.userId;

    logger.debug(`Fetching user with ID: ${userId}`);
    const user = await prisma.user.findUnique({
      where: { id: userId as string },
    });

    logger.debug(`Fetching bounty before update with ID: ${id}`);
    const listingBeforeUpdate = await prisma.bounties.findUnique({
      where: { id: id as string },
    });

    if (
      !user ||
      !user.currentSponsorId ||
      listingBeforeUpdate?.sponsorId !== user.currentSponsorId
    ) {
      logger.warn('User does not have a current sponsor or is unauthorized');
      return res
        .status(403)
        .json({ error: 'User does not have a current sponsor.' });
    }

    if (!listingBeforeUpdate) {
      logger.warn(`Bounty with ID: ${id} not found`);
      return res
        .status(404)
        .json({ message: `Bounty with id=${id} not found.` });
    }

    const {
      rewards,
      rewardAmount,
      token,
      maxRewardAsk,
      minRewardAsk,
      compensationType,
      isPublished,
    } = updatedData;

    let publishedAt = listingBeforeUpdate.publishedAt;
    if (isPublished && !listingBeforeUpdate.publishedAt) {
      publishedAt = new Date();
    }

    const newRewardsCount = Object.keys(rewards || {}).length;
    const currentTotalWinners = listingBeforeUpdate.totalWinnersSelected || 0;

    if (newRewardsCount < currentTotalWinners) {
      updatedData.totalWinnersSelected = newRewardsCount;
      const positions = ['first', 'second', 'third', 'fourth', 'fifth'];
      const positionsToReset = positions.slice(newRewardsCount);

      for (const position of positionsToReset) {
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
        rewards,
        rewardAmount,
        token,
        maxRewardAsk,
        minRewardAsk,
        compensationType,
        isPublished,
        publishedAt,
        ...updatedData,
        usdValue,
      },
      include: { sponsor: true },
    });

    try {
      if (
        listingBeforeUpdate.isPublished === true &&
        result.isPublished === false
      ) {
        await discordListingUpdate(result, 'Unpublished');
      }
      if (
        listingBeforeUpdate.isPublished === false &&
        result.isPublished === true
      ) {
        await discordListingUpdate(result, 'Published');
      }
    } catch (err) {
      logger.error('Discord Listing Update Message Error', err);
    }

    // listing email check
    logger.info(`Bounty with ID: ${id} updated successfully`);
    logger.debug(`Updated bounty data: ${safeStringify(result)}`);

    const shouldSendEmail = await shouldSendEmailForListing(result);
    if (listingBeforeUpdate.isPublished === false && shouldSendEmail) {
      logger.debug(`Sending email notification for listing creation`);
      await sendEmailNotification({
        type: 'createListing',
        id: id as string,
        triggeredBy: userId,
      });
    }

    const deadlineChanged =
      listingBeforeUpdate.deadline?.toString() !== result.deadline?.toString();
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
        triggeredBy: userId,
      });
    }

    if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'production') {
      try {
        const zapierWebhookUrl = process.env.ZAPIER_BOUNTY_WEBHOOK!;
        logger.debug(`Sending data to Zapier Webhook: ${zapierWebhookUrl}`);
        await axios.post(zapierWebhookUrl, result);
      } catch (err) {
        logger.error('Error with Zapier Webhook -', err);
      }
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

export default withAuth(bounty);
