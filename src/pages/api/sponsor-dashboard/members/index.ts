import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithSponsor } from '@/features/auth/types';
import { withSponsorAuth } from '@/features/auth/utils/withSponsorAuth';

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  const params = req.query;
  const sponsorId = req.userSponsorId;
  const skip = params.skip ? parseInt(params.skip as string, 10) : 0;
  const take = params.take ? parseInt(params.take as string, 10) : 15;
  const searchText = params.searchText as string;

  logger.debug(`Query params: ${safeStringify(params)}`);

  const searchTextFields = ['email', 'username', 'name'];
  const whereSearch = searchText
    ? {
        OR: searchTextFields.map((field) => ({
          user: {
            [field]: {
              contains: searchText,
            },
          },
        })),
      }
    : {};

  try {
    logger.debug('Fetching total count of members');
    const total = await prisma.userSponsors.count({
      where: {
        sponsorId,
        ...whereSearch,
      },
    });

    logger.debug('Fetching member details');
    const result = await prisma.userSponsors.findMany({
      where: {
        sponsorId,
        ...whereSearch,
      },
      skip: skip ?? 0,
      take: take ?? 15,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            name: true,
            photo: true,
          },
        },
      },
    });

    logger.info('Successfully fetched member details');
    res.status(200).json({ total, data: result });
  } catch (err: any) {
    logger.error(`Error fetching members: ${safeStringify(err)}`);
    res.status(400).json({ error: 'Error occurred while fetching members.' });
  }
}

export default withSponsorAuth(handler);
