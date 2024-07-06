import axios from 'axios';
import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { sendEmailNotification } from '@/features/emails';
import { shouldSendEmailForListing } from '@/features/listing-builder';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { dayjs } from '@/utils/dayjs';
import { fetchTokenUSDValue } from '@/utils/fetchTokenUSDValue';

async function bounty(req: NextApiRequestWithUser, res: NextApiResponse) {
  const { id } = req.query;
  const updatedData = req.body;

  try {
    const userId = req.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId as string },
    });

    const listingBeforeUpdate = await prisma.bounties.findUnique({
      where: { id: id as string },
    });

    if (
      !user ||
      !user.currentSponsorId ||
      listingBeforeUpdate?.sponsorId !== user.currentSponsorId
    ) {
      return res
        .status(403)
        .json({ error: 'User does not have a current sponsor.' });
    }

    if (!listingBeforeUpdate) {
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

    // update total winners selected and reset winner positions if necessary
    if (newRewardsCount < currentTotalWinners) {
      updatedData.totalWinnersSelected = newRewardsCount;
      const positions = ['first', 'second', 'third', 'fourth', 'fifth'];
      const positionsToReset = positions.slice(newRewardsCount);

      for (const position of positionsToReset) {
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
    });

    // listing email check
    const shouldSendEmail = await shouldSendEmailForListing(result);
    if (listingBeforeUpdate.isPublished === false && shouldSendEmail) {
      await sendEmailNotification({
        type: 'createListing',
        id: id as string,
        triggeredBy: userId,
      });
    }

    // check if deadline has changed and send email if it has
    const deadlineChanged =
      listingBeforeUpdate.deadline?.toString() !== result.deadline?.toString();
    if (deadlineChanged && result.isPublished) {
      const dayjsDeadline = dayjs(result.deadline);
      await prisma.comment.create({
        data: {
          message: `The deadline for this listing has been updated to ${dayjsDeadline.format('h:mm A, MMMM D, YYYY (UTC)')}`,
          listingId: result.id,
          authorId: result.pocId,
          type: 'DEADLINE_EXTENSION',
        },
      });
      await sendEmailNotification({
        type: 'deadlineExtended',
        id: id as string,
        triggeredBy: userId,
      });
    }

    if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'production') {
      try {
        const zapierWebhookUrl = process.env.ZAPIER_BOUNTY_WEBHOOK!;
        await axios.post(zapierWebhookUrl, result);
      } catch (err) {
        logger.error('Error with Zapier Webhook -', err);
      }
    }

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      error,
      message: `Error occurred while updating bounty with id=${id}.`,
    });
  }
}

export default withAuth(bounty);
