import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { parseBoundedIntegerParam } from '@/utils/apiPagination';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithUser } from '@/features/auth/types';
import { withAuth } from '@/features/auth/utils/withAuth';
import { listingSelect } from '@/features/listings/constants/schema';

async function getBookmarks(req: NextApiRequestWithUser, res: NextApiResponse) {
  logger.debug(`Request query: ${safeStringify(req.query)}`);

  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const takeResult = parseBoundedIntegerParam(req.query.take, {
      defaultValue: 50,
      maxValue: 100,
      minValue: 1,
      name: 'take',
    });
    if (!takeResult.ok) {
      return res.status(400).json({ error: takeResult.error });
    }
    const take = req.query.take ? takeResult.value : undefined;

    logger.debug(`Fetching bookmarks for user ID: ${userId}`);

    const listings = await prisma.bounties.findMany({
      where: {
        SubscribeBounty: {
          some: {
            userId,
            isArchived: false,
          },
        },
        isActive: true,
        isArchived: false,
        isPublished: true,
      },
      select: listingSelect,
      take,
      orderBy: { createdAt: 'desc' },
    });

    logger.info(`Fetched ${listings.length} bookmarks for user ID: ${userId}`);
    return res.status(200).json(listings);
  } catch (error: any) {
    logger.error(
      `Error occurred while fetching bookmarks for user ID=${req.userId}: ${safeStringify(error)}`,
    );
    return res.status(500).json({
      error: error.message,
      message: 'Error occurred while fetching bookmarks.',
    });
  }
}

export default withAuth(getBookmarks);
