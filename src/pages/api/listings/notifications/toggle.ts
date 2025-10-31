import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithUser } from '@/features/auth/types';
import { withAuth } from '@/features/auth/utils/withAuth';

async function toggleBookmark(
  req: NextApiRequestWithUser,
  res: NextApiResponse,
) {
  logger.debug(`Request body: ${safeStringify(req.body)}`);
  const { bountyId } = req.body;
  const userId = req.userId;

  try {
    logger.debug(
      `Fetching bookmark status for listing ID: ${bountyId} and user ID: ${userId}`,
    );
    const bookmarkFound = await prisma.subscribeBounty.findFirst({
      where: { bountyId, userId },
    });

    let result;
    if (bookmarkFound) {
      logger.info(
        `Bookmark found for listing ID: ${bountyId} and user ID: ${userId}, toggling isArchived status`,
      );
      result = await prisma.subscribeBounty.update({
        where: { id: bookmarkFound.id },
        data: { isArchived: !bookmarkFound.isArchived },
      });
    } else {
      logger.info(
        `No bookmark found for listing ID: ${bountyId} and user ID: ${userId}, creating new bookmark`,
      );
      result = await prisma.subscribeBounty.create({
        data: { bountyId, userId: userId as string },
      });
    }

    logger.info(
      `Bookmark toggled successfully for listing ID: ${bountyId} and user ID: ${userId}`,
    );
    return res.status(200).json(result);
  } catch (error: any) {
    logger.error(
      `Error occurred while toggling bookmark for listing ID: ${bountyId} and user ID: ${userId}: ${safeStringify(error)}`,
    );
    return res.status(400).json({
      error: error.message,
      message: 'Error occurred while toggling bookmark.',
    });
  }
}

export default withAuth(toggleBookmark);
