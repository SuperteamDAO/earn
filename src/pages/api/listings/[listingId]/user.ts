import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const params = req.query;
  const listingId = params.listingId as string;
  const userId = req.userId;

  logger.debug(`Request query: ${safeStringify(req.query)}`);

  try {
    logger.debug(
      `Fetching submission for listing ID: ${listingId} and user ID: ${userId}`,
    );
    const result = await prisma.submission.findFirst({
      where: {
        listingId,
        userId,
        isActive: true,
        isArchived: false,
      },
    });

    logger.info(
      `Fetched submission for listing ID: ${listingId} and user ID: ${userId}`,
    );
    res.status(200).json(result);
  } catch (error: any) {
    logger.error(
      `Error occurred while fetching submission for listing ID=${listingId} and user ID=${userId}: ${safeStringify(error)}`,
    );
    res.status(400).json({
      error: error.message,
      message: `Error occurred while fetching submission of listing=${listingId} for user=${userId}.`,
    });
  }
}

export default withAuth(handler);
