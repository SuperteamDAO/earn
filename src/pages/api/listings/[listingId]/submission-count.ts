import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

export default async function submission(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const params = req.query;
  const listingId = params.listingId as string;

  logger.debug(`Request query: ${safeStringify(req.query)}`);

  try {
    logger.debug(`Fetching submission count for listing ID: ${listingId}`);
    const result = await prisma.submission.aggregate({
      _count: true,
      where: {
        listingId,
        isActive: true,
        isArchived: false,
      },
    });

    const submissionCount = result?._count || 0;
    logger.info(
      `Fetched submission count for listing ID: ${listingId}: ${submissionCount}`,
    );
    res.status(200).json(submissionCount);
  } catch (error: any) {
    logger.error(
      `Error occurred while fetching submission count for listing ID=${listingId}: ${safeStringify(error)}`,
    );
    res.status(400).json({
      error: error.message,
      message: `Error occurred while fetching submission count of listing=${listingId}.`,
    });
  }
}
