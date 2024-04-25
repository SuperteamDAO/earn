import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { prisma } from '@/prisma';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;

  const { listingId, link, tweet, otherInfo, eligibilityAnswers, ask } =
    req.body;

  try {
    const submission = await prisma.submission.findFirst({
      where: {
        userId,
        listingId,
      },
    });

    const result = await prisma.submission.update({
      where: {
        id: submission?.id,
      },
      data: {
        listingId,
        link: link || '',
        tweet: tweet || '',
        otherInfo: otherInfo || '',
        eligibilityAnswers: eligibilityAnswers || undefined,
        ask: ask || null,
      },
      include: {
        user: true,
        listing: true,
      },
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error(`User ${userId} unable to edit submission`, error.message);
    return res.status(400).json({
      error,
      message: 'Error occurred while updating the submission.',
    });
  }
}

export default withAuth(handler);
