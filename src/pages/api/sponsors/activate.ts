import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withGodAuth } from '@/features/auth';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';

interface ActivateSponsorRequest extends NextApiRequestWithUser {
  sponsorId?: string;
}

async function activateSponsor(
  req: ActivateSponsorRequest,
  res: NextApiResponse,
) {
  try {
    const { sponsorId } = req.body;

    if (!sponsorId) {
      logger.warn('Invalid sponsor ID');
      return res.status(400).json({ error: 'Invalid sponsor ID' });
    }

    // update sponsor is active to true
    const result = await prisma.sponsors.update({
      where: {
        id: sponsorId,
      },
      data: {
        isActive: true,
      },
    });

    logger.info(`God activated successfully for sponsor: ${sponsorId}`);
    return res.status(200).json(result);
  } catch (error: any) {
    logger.error(`Error occurred while activating sponsor: ${error.message}`);
    return res.status(500).json({
      error: error.message || 'Internal server error',
      message: 'Error occurred while activating sponsor.',
    });
  }
}

export default withGodAuth(activateSponsor);
