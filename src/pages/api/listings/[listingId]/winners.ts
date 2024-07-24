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
    logger.debug(`Fetching winning submissions for listing ID: ${listingId}`);
    const result = await prisma.submission.findMany({
      where: {
        listingId,
        isActive: true,
        isArchived: false,
        isWinner: true,
      },
      take: 100,
      orderBy: { updatedAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            photo: true,
          },
        },
      },
    });

    logger.info(
      `Fetched ${result.length} winning submissions for listing ID: ${listingId}`,
    );
    res.status(200).json(result);
  } catch (error: any) {
    logger.error(
      `Error occurred while fetching winning submissions for listing ID=${listingId}: ${safeStringify(error)}`,
    );
    res.status(400).json({
      error: error.message,
      message: `Error occurred while fetching winning submissions for listing ID=${listingId}.`,
    });
  }
}
