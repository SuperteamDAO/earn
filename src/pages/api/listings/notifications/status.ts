import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const { listingId } = req.body;
    const result = await prisma.subscribeBounty.findMany({
      where: { bountyId: listingId, isArchived: false },
      include: { User: true },
    });
    res.status(200).json(result);
  } catch (error) {
    logger.error(error);
    res.status(400).json({
      error,
      message: 'Error occurred while fetching subscription status.',
    });
  }
}
