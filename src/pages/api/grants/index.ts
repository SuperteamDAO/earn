import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

export default async function grants(
  _req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    logger.debug('Fetching grants from database');
    const result = await prisma.grants.findMany({
      where: {
        isActive: true,
        isPublished: true,
        isArchived: false,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        id: true,
        title: true,
        slug: true,
        shortDescription: true,
        token: true,
        minReward: true,
        maxReward: true,
        link: true,
        logo: true,
        sponsor: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
      },
    });

    logger.info(`Fetched ${result.length} grants successfully`);
    return res.status(200).json(result);
  } catch (error: any) {
    logger.error(
      `Error occurred while fetching grants: ${safeStringify(error)}`,
    );
    return res
      .status(400)
      .json({ err: 'Error occurred while fetching grants.' });
  }
}
