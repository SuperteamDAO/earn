import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

async function toggleSubscription(
  req: NextApiRequestWithUser,
  res: NextApiResponse,
) {
  logger.debug(`Request body: ${safeStringify(req.body)}`);
  const { bountyId } = req.body;
  const userId = req.userId;

  try {
    logger.debug(
      `Fetching subscription status for bounty ID: ${bountyId} and user ID: ${userId}`,
    );
    const subFound = await prisma.subscribeBounty.findFirst({
      where: { bountyId, userId },
    });

    let result;
    if (subFound) {
      logger.info(
        `Subscription found for bounty ID: ${bountyId} and user ID: ${userId}, toggling isArchived status`,
      );
      result = await prisma.subscribeBounty.update({
        where: { id: subFound.id },
        data: { isArchived: !subFound.isArchived },
      });
    } else {
      logger.info(
        `No subscription found for bounty ID: ${bountyId} and user ID: ${userId}, creating new subscription`,
      );
      result = await prisma.subscribeBounty.create({
        data: { bountyId, userId: userId as string },
      });
    }

    logger.info(
      `Subscription toggled successfully for bounty ID: ${bountyId} and user ID: ${userId}`,
    );
    return res.status(200).json(result);
  } catch (error: any) {
    logger.error(
      `Error occurred while toggling subscription for bounty ID: ${bountyId} and user ID: ${userId}: ${safeStringify(error)}`,
    );
    return res.status(400).json({
      error: error.message,
      message: 'Error occurred while toggling subscription.',
    });
  }
}

export default withAuth(toggleSubscription);
