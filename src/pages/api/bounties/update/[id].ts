import axios from 'axios';
import dayjs from 'dayjs';
import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { sendEmailNotification } from '@/features/emails';
import { hasRewardConditionsForEmail } from '@/features/listing-builder';
import { prisma } from '@/prisma';
import { fetchTokenUSDValue } from '@/utils/fetchTokenUSDValue';

async function bounty(req: NextApiRequestWithUser, res: NextApiResponse) {
  const params = req.query;
  const id = params.id as string;
  const updatedData = req.body;

  try {
    const userId = req.userId;

    const user = await prisma.user.findUnique({
      where: {
        id: userId as string,
      },
    });

    const currentBounty = await prisma.bounties.findUnique({
      where: { id },
    });

    if (!user) {
      return res
        .status(403)
        .json({ error: 'User does not have a current sponsor.' });
    }

    if (
      !user ||
      !user.currentSponsorId ||
      currentBounty?.sponsorId !== user.currentSponsorId
    ) {
      return res
        .status(403)
        .json({ error: 'User does not have a current sponsor.' });
    }

    if (!currentBounty) {
      return res
        .status(404)
        .json({ message: `Bounty with id=${id} not found.` });
    }

    const newRewardsCount = Object.keys(updatedData.rewards || {}).length;
    const currentTotalWinners = currentBounty.totalWinnersSelected || 0;

    if (newRewardsCount < currentTotalWinners) {
      updatedData.totalWinnersSelected = newRewardsCount;

      const positions = ['first', 'second', 'third', 'fourth', 'fifth'];
      const positionsToReset = positions.slice(newRewardsCount);

      for (const position of positionsToReset) {
        await prisma.submission.updateMany({
          where: {
            listingId: id,
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

    let usdValue = currentBounty.usdValue;
    if (currentBounty.rewardAmount !== updatedData.rewardAmount) {
      const tokenUsdValue = await fetchTokenUSDValue(
        updatedData.token,
        updatedData.publishedAt,
      );
      usdValue = tokenUsdValue * updatedData.rewardAmount;
    }

    const result = await prisma.bounties.update({
      where: { id },
      data: {
        ...updatedData,
        usdValue,
      },
    });

    if (
      currentBounty?.isPublished === false &&
      result.isPublished === true &&
      !result.isPrivate &&
      result.type !== 'hackathon' &&
      hasRewardConditionsForEmail(result)
    ) {
      await sendEmailNotification({
        type: 'createListing',
        id,
      });
    }

    const deadlineChanged =
      currentBounty.deadline?.toString() !== result.deadline?.toString();
    if (deadlineChanged && result.isPublished) {
      const dayjsDeadline = dayjs(result.deadline);
      await prisma.comment.create({
        data: {
          message: `The deadline for this listing has been updated to ${dayjsDeadline.format(
            'h:mm A, MMMM D, YYYY (UTC)',
          )}`,
          listingId: result.id,
          authorId: result.pocId,
          type: 'DEADLINE_EXTENSION',
        },
      });
      await sendEmailNotification({
        type: 'deadlineExtended',
        id,
      });
    }

    try {
      if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'production') {
        const zapierWebhookUrl = process.env.ZAPIER_BOUNTY_WEBHOOK!;
        await axios.post(zapierWebhookUrl, result);
      }
    } catch (err) {
      console.log('Error with Zapier Webhook -', err);
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
