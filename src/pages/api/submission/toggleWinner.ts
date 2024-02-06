import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

import { prisma } from '@/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
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

  if (!user) {
    return res.status(400).json({ error: 'Unauthorized' });
  }

  const { id, isWinner, winnerPosition } = req.body;
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
    });

    if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'production') {
      const zapierWebhookUrl = process.env.ZAPIER_SUBMISSION_WEBHOOK!;
      await axios.post(zapierWebhookUrl, result);
    }

    if (currentSubmission.isWinner !== isWinner) {
      const bountyId = result.listingId;
      await prisma.bounties.update({
        where: { id: bountyId },
        data: {
          totalWinnersSelected: isWinner ? { increment: 1 } : { decrement: 1 },
        },
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      error,
      message: `Error occurred while updating submission ${id}.`,
    });
  }
}
