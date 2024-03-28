import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

import { sendEmailNotification } from '@/features/emails';
import { prisma } from '@/prisma';

export default async function bounty(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const params = req.query;
  const id = params.id as string;
  const updatedData = req.body;

  try {
    const token = await getToken({ req });

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = token.id;

    if (!userId) {
      return res.status(400).json({ error: 'Invalid token' });
    }

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

    const result = await prisma.bounties.update({
      where: { id },
      data: updatedData,
    });

    if (
      currentBounty?.isPublished === false &&
      result.isPublished === true &&
      !result.isPrivate &&
      result.type !== 'hackathon'
    ) {
      await sendEmailNotification({
        type: 'createListing',
        id,
        userId: userId as string,
      });
    }

    const deadlineChanged = currentBounty.deadline !== updatedData.deadline;
    if (deadlineChanged) {
      await sendEmailNotification({
        type: 'deadlineExtended',
        id,
        userId: userId as string,
      });
    }

    if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'production') {
      const zapierWebhookUrl = process.env.ZAPIER_BOUNTY_WEBHOOK!;
      await axios.post(zapierWebhookUrl, result);
    }

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      error,
      message: `Error occurred while updating bounty with id=${id}.`,
    });
  }
}
