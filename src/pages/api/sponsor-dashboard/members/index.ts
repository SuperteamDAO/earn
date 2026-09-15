import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { parseBoundedIntegerParam } from '@/utils/apiPagination';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithSponsor } from '@/features/auth/types';
import { withSponsorAuth } from '@/features/auth/utils/withSponsorAuth';

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  const params = req.query;
  const sponsorId = req.userSponsorId;
  const skipResult = parseBoundedIntegerParam(params.skip, {
    defaultValue: 0,
    maxValue: 1000,
    name: 'skip',
  });
  const takeResult = parseBoundedIntegerParam(params.take, {
    defaultValue: 15,
    maxValue: 50,
    minValue: 1,
    name: 'take',
  });
  if (!skipResult.ok) {
    return res.status(400).json({ error: skipResult.error });
  }
  if (!takeResult.ok) {
    return res.status(400).json({ error: takeResult.error });
  }
  const skip = skipResult.value;
  const take = takeResult.value;
  const searchText = params.searchText as string;

  logger.debug(`Query params: ${safeStringify(params)}`);

  const searchTextFields = ['email', 'username', 'firstName', 'lastName'];
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
            firstName: true,
            lastName: true,
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
