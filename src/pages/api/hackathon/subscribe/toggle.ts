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
  const { slug } = req.body;
  const userId = req.userId;

  try {
    logger.debug(
      `Fetching hackathon and subscription status for slug: ${slug} and user ID: ${userId}`,
    );

    const hackathon = await prisma.hackathon.findUnique({
      where: { slug },
    });

    if (!hackathon) {
      logger.warn(`Hackathon not found for slug: ${slug}`);
      return res.status(404).json({ message: 'Hackathon not found' });
    }

    const subFound = await prisma.subscribeHackathon.findFirst({
      where: { hackathonId: hackathon.id, userId },
    });

    let result;
    if (subFound) {
      logger.info(
        `Subscription found for hackathon slug: ${slug} and user ID: ${userId}, toggling isArchived status`,
      );
      result = await prisma.subscribeHackathon.update({
        where: { id: subFound.id },
        data: { isArchived: !subFound.isArchived },
      });
    } else {
      logger.info(
        `No subscription found for hackathon slug: ${slug} and user ID: ${userId}, creating new subscription`,
      );
      result = await prisma.subscribeHackathon.create({
        data: { hackathonId: hackathon.id, userId: userId as string },
      });
    }

    logger.info(
      `Subscription toggled successfully for hackathon slug: ${slug} and user ID: ${userId}`,
    );
    return res.status(200).json(result);
  } catch (error: any) {
    logger.error(
      `Error occurred while toggling subscription for hackathon slug: ${slug} and user ID: ${userId}: ${safeStringify(error)}`,
    );
    return res.status(400).json({
      error: error.message,
      message: 'Error occurred while toggling subscription.',
    });
  }
}

export default withAuth(toggleSubscription);
