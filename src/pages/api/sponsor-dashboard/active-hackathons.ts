import { type NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';

import { type NextApiRequestWithSponsor } from '@/features/auth/types';
import { withSponsorAuth } from '@/features/auth/utils/withSponsorAuth';

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  if (!req.hackathonId) {
    logger.warn(`User ${req.userId} has no Hackathon ID`);
    return res.status(400).json({
      message: 'User has no Hackathon ID',
      error: 'User has no Hackathon ID',
    });
  }

  try {
    const now = new Date();
    const hackathons = await prisma.hackathon.findMany({
      where: {
        ...(req.role !== 'GOD'
          ? {
              id: req.hackathonId,
            }
          : {}),
        deadline: {
          not: null,
          gt: now,
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        altLogo: true,
        logo: true,
        deadline: true,
        eligibility: true,
      },
    });
    if (!hackathons) {
      logger.warn(`Hackathon with ID ${req.hackathonId} does not exist`);
      return res.status(400).json({
        message: `Hackathon with ID ${req.hackathonId} does not exist`,
        error: `Hackathon with ID ${req.hackathonId} does not exist`,
      });
    }

    return res.status(200).json(hackathons);
  } catch (error: any) {
    logger.error('Error looking for active hackathon', error);
    return res.status(500).json({
      message: 'Error looking for active hackathon',
      error,
    });
  }
}

export default withSponsorAuth(handler);
