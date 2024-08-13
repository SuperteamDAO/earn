import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  logger.debug(`Request query: ${safeStringify(req.query)}`);

  try {
    const { listingId } = req.query;

    if (!listingId || typeof listingId !== 'string') {
      return res.status(400).json({ message: 'Invalid listingId' });
    }

    logger.debug(`Fetching subscription status for listing ID: ${listingId}`);
    const result = await prisma.subscribeBounty.findMany({
      where: { bountyId: listingId, isArchived: false },
    });

    logger.info(`Fetched subscription status for listing ID: ${listingId}`);
    res.status(200).json(result);
  } catch (error: any) {
    logger.error(
      `Error occurred while fetching subscription status for listing ID=${req.query.listingId}: ${safeStringify(error)}`,
    );
    res.status(500).json({
      error: error.message,
      message: 'Error occurred while fetching subscription status.',
    });
  }
}
