import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id, isWinner, winnerPosition } = req.body;
  try {
    const currentSubmission = await prisma.submission.findUnique({
      where: { id },
    });

    if (!currentSubmission) {
      return res.status(404).json({
        message: `Submission with ID ${id} not found.`,
      });
    }

    const result = await prisma.submission.update({
      where: { id },
      data: { isWinner, winnerPosition },
    });

    const zapierWebhookUrl = process.env.ZAPIER_SUBMISSION_WEBHOOK!;
    await axios.post(zapierWebhookUrl, result);

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
