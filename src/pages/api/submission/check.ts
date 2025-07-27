import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithUser } from '@/features/auth/types';
import { withAuth } from '@/features/auth/utils/withAuth';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const { listingId } = req.query;
  const userId = req.userId;

  if (!listingId || typeof listingId !== 'string') {
    return res.status(400).json({ error: 'Invalid or missing listingId' });
  }

  logger.debug(`Request query: ${safeStringify(req.query)}`);

  try {
    logger.debug(
      `Checking submission existence for listing ID: ${listingId} and user ID: ${userId}`,
    );
    const submission = await prisma.submission.findFirst({
      where: {
        listingId,
        userId,
        isActive: true,
        isArchived: false,
      },
      select: {
        id: true,
        status: true,
        isWinner: true,
        isPaid: true,
        winnerPosition: true,
        listing: {
          select: {
            isWinnersAnnounced: true,
          },
        },
        user: {
          select: {
            isKYCVerified: true,
          },
        },
      },
    });

    const responseData: {
      isSubmitted: boolean;
      status: string | null;
      isWinner?: boolean;
      isKYCVerified?: boolean;
      isPaid?: boolean;
      winnerPosition?: number;
      id?: string;
    } = {
      isSubmitted: !!submission,
      status: submission ? submission.status : null,
      id: submission?.id,
    };

    if (submission?.listing.isWinnersAnnounced) {
      responseData.isWinner = submission.isWinner;
      responseData.isKYCVerified = submission.user.isKYCVerified;
      responseData.isPaid = submission.isPaid;
      responseData.winnerPosition = submission.winnerPosition ?? undefined;
    }

    logger.info(
      `Checked submission existence for listing ID: ${listingId} and user ID: ${userId}`,
    );
    res.status(200).json(responseData);
  } catch (error: any) {
    logger.error(
      `Error occurred while checking submission existence for listing ID=${listingId} and user ID=${userId}: ${safeStringify(error)}`,
    );
    res.status(400).json({
      error: error.message,
      message: `Error occurred while checking submission existence for listing=${listingId} and user=${userId}.`,
    });
  }
}

export default withAuth(handler);
