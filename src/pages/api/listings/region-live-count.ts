import { type Regions } from '@prisma/client';
import { type NextApiRequest, type NextApiResponse } from 'next';

import { Superteams } from '@/constants/Superteam';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

export default async function regionLiveCount(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const params = req.query;
  const region = params.region as string;

  logger.debug(`Request query: ${safeStringify(req.query)}`);

  const st = Superteams.find((team) => team.region.toLowerCase() === region);
  const superteam = st?.name;

  logger.debug(`Solar listing count for region ${region}: ${superteam}`);

  try {
    logger.debug('Fetching Count');
    const bountiesCount = await prisma.bounties.count({
      where: {
        isPublished: true,
        isActive: true,
        isArchived: false,
        isPrivate: false,
        status: 'OPEN',
        deadline: {
          gt: new Date(),
        },
        OR: [
          {
            region: {
              in: [region.toUpperCase() as Regions],
            },
          },
          {
            sponsor: {
              name: superteam,
            },
          },
        ],
      },
    });

    logger.info(`Successfully fetched count of listings for region=${region}`);
    return res.status(200).json({ count: bountiesCount });
  } catch (error) {
    logger.error(
      `Error fetching listing count for region=${region}: ${safeStringify(error)}`,
    );
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Error occurred while fetching listings',
    });
  }
}
