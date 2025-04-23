import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';

import { type NextApiRequestWithSponsor } from '@/features/auth/types';
import { withSponsorAuth } from '@/features/auth/utils/withSponsorAuth';

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  const userId = req.userId;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (req.role !== 'GOD') {
    return res.status(403).json({ error: 'Unauthorized access' });
  }

  logger.debug(`Request body: ${JSON.stringify(req.body)}`);
  const { id, isArchived } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Listing ID is required' });
  }

  if (isArchived === undefined) {
    return res.status(400).json({ error: 'isArchived is required' });
  }

  try {
    const currentListing = await prisma.bounties.findUnique({
      where: { id },
    });

    if (!currentListing) {
      logger.warn(`Listing with ID ${id} not found`);
      return res.status(404).json({
        message: `Listing with ID ${id} not found.`,
      });
    }

    const result = await prisma.bounties.update({
      where: { id },
      data: {
        isArchived: isArchived,
        updatedAt: new Date(),
      },
    });

    const actionText = isArchived ? 'archived' : 'restored';
    logger.info(`Successfully ${actionText} listing with ID: ${id}`);

    return res.status(200).json({
      message: `Listing successfully ${actionText}`,
      listing: result,
    });
  } catch (error: any) {
    logger.error(
      `User ${userId} unable to toggle archive status: ${error.message}`,
    );
    return res.status(400).json({
      error: error.message,
      message: `Error occurred while updating listing ${id}.`,
    });
  }
}

export default withSponsorAuth(handler);
