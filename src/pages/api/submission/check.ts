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
        label: true,
        isPaid: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    logger.info(
      `Checked submission existence for listing ID: ${listingId} and user ID: ${userId}`,
    );
    res.status(200).json({
      isSubmitted: !!submission,
      status: submission ? submission?.status : null,
      label: submission ? submission?.label : null,
      isPaid: submission ? submission?.isPaid : null,
    });
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
