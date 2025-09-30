import { type NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';

import { type NextApiRequestWithSponsor } from '@/features/auth/types';
import { withSponsorAuth } from '@/features/auth/utils/withSponsorAuth';

async function handler(_: NextApiRequestWithSponsor, res: NextApiResponse) {
  try {
    const now = new Date();
    const hackathons = await prisma.hackathon.findMany({
      where: {
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
      logger.warn(`No active hackathons found`);
      return res.status(400).json({
        message: `No active hackathons found`,
        error: `No active hackathons found`,
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
