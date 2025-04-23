import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';

import { type NextApiRequestWithSponsor } from '@/features/auth/types';
import { withSponsorAuth } from '@/features/auth/utils/withSponsorAuth';

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  const userSponsorId = req.userSponsorId;
  const isGod = req.role === 'GOD';
  const isActive = isGod ? {} : { isActive: true };

  try {
    const data = await prisma.submission.findMany({
      where: {
        listing: {
          sponsorId: userSponsorId,
          ...isActive,
        },
      },
      include: {
        listing: {
          include: {
            sponsor: true,
          },
        },
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    logger.info(
      `Successfully fetched sponsorship submissions for sponsor ${userSponsorId}`,
    );

    res.status(200).json(
      data.map((submission) => ({
        ...submission,
        status:
          !submission.listing.isActive ||
          submission.isArchived ||
          submission.listing.isArchived
            ? 'Deleted'
            : submission.status,
      })),
    );
  } catch (err: any) {
    logger.error(
      `Error fetching sponsorship submissions for sponsor ${userSponsorId}: ${err.message}`,
    );
    res
      .status(400)
      .json({ err: 'Error occurred while fetching sponsorship submissions.' });
  }
}

export default withSponsorAuth(handler);
