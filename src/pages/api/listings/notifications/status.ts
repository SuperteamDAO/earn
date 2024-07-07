import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  logger.debug(`Request body: ${safeStringify(req.body)}`);

  try {
    const { listingId } = req.body;

    logger.debug(`Fetching subscription status for listing ID: ${listingId}`);
    const result = await prisma.subscribeBounty.findMany({
      where: { bountyId: listingId, isArchived: false },
      include: { User: true },
    });

    logger.info(`Fetched subscription status for listing ID: ${listingId}`);
    res.status(200).json(result);
  } catch (error: any) {
    logger.error(
      `Error occurred while fetching subscription status for listing ID=${req.body.listingId}: ${safeStringify(error)}`,
    );
    res.status(400).json({
      error: error.message,
      message: 'Error occurred while fetching subscription status.',
    });
  }
}
