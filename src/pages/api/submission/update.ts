import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;

  const { listingId, link, tweet, otherInfo, eligibilityAnswers, ask } =
    req.body;

  logger.debug(`Request body: ${safeStringify(req.body)}`);

  if (!listingId) {
    return res.status(400).json({
      message: 'Listing ID is required.',
    });
  }

  try {
    const submission = await prisma.submission.findFirst({
      where: {
        userId,
        listingId,
      },
    });

    if (!submission) {
      return res.status(404).json({
        message: 'Submission not found.',
      });
    }

    const result = await prisma.submission.update({
      where: {
        id: submission.id,
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
    logger.error(`User ${userId} unable to edit submission: ${error.message}`);
    return res.status(500).json({
      error: error.message,
      message: 'Error occurred while updating the submission.',
    });
  }
}

export default withAuth(handler);
