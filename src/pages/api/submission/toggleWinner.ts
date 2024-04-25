import axios from 'axios';
import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { prisma } from '@/prisma';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;

  const user = await prisma.user.findUnique({
    where: {
      id: userId as string,
    },
  });

  if (!user) {
    return res.status(400).json({ error: 'Unauthorized' });
  }

  const { id, isWinner, winnerPosition, ask } = req.body;
  try {
    const currentSubmission = await prisma.submission.findUnique({
      where: { id },
      include: { listing: true },
    });

    if (!currentSubmission) {
      return res.status(404).json({
        message: `Submission with ID ${id} not found.`,
      });
    }

    if (user.currentSponsorId !== currentSubmission.listing.sponsorId) {
      return res.status(403).json({
        message: 'Unauthorized',
      });
    }

    const result = await prisma.submission.update({
      where: { id },
      data: { isWinner, winnerPosition },
      include: {
        listing: true,
      },
    });

    try {
      if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'production') {
        const zapierWebhookUrl = process.env.ZAPIER_SUBMISSION_WEBHOOK!;
        await axios.post(zapierWebhookUrl, result);
      }
    } catch (err) {
      console.log('Error with Zapier Webhook -', err);
    }

    if (currentSubmission.isWinner !== isWinner) {
      const bountyId = result.listingId;
      await prisma.bounties.update({
        where: { id: bountyId },
        data: {
          totalWinnersSelected: isWinner ? { increment: 1 } : { decrement: 1 },
          ...(result.listing.compensationType !== 'fixed' && {
            rewards: { first: ask },
            rewardAmount: ask,
          }),
        },
      });
    }

    return res.status(200).json(result);
  } catch (error: any) {
    console.error(`User ${userId} unable to toggle winners`, error.message);
    return res.status(400).json({
      error,
      message: `Error occurred while updating submission ${id}.`,
    });
  }
}

export default withAuth(handler);
