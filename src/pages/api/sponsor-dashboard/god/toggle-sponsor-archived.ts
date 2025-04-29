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
    return res.status(400).json({ error: 'Sponsor ID is required' });
  }

  if (isArchived === undefined) {
    return res.status(400).json({ error: 'isArchived is required' });
  }

  try {
    const currentSponsor = await prisma.sponsors.findUnique({
      where: { id },
    });

    if (!currentSponsor) {
      logger.warn(`Sponsor with ID ${id} not found`);
      return res.status(404).json({
        message: `Sponsor with ID ${id} not found.`,
      });
    }

    const result = await prisma.sponsors.update({
      where: { id },
      data: {
        isArchived: isArchived,
        isActive: isArchived ? false : true,
        updatedAt: new Date(),
      },
    });

    const actionText = isArchived ? 'archived' : 'restored';
    logger.info(
      `User ${userId} successfully ${actionText} sponsor with ID: ${id}`,
    );

    return res.status(200).json({
      message: `Sponsor successfully ${actionText}`,
      sponsor: result,
    });
  } catch (error: any) {
    logger.error(
      `User ${userId} unable to toggle sponsor archive status: ${error.message}`,
    );
    return res.status(400).json({
      error: error.message,
      message: `Error occurred while updating sponsor ${id}.`,
    });
  }
}

export default withSponsorAuth(handler);
