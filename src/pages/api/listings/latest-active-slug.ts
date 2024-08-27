import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

async function latestActiveSlug(
  req: NextApiRequestWithUser,
  res: NextApiResponse,
) {
  const userId = req.userId;

  logger.debug(`Request user ID: ${userId}`);

  try {
    logger.debug(`Fetching user with ID: ${userId}`);
    const user = await prisma.user.findUnique({
      where: {
        id: userId as string,
      },
    });

    if (!user || !user.currentSponsorId) {
      logger.warn(`User ${userId} does not have a current sponsor`);
      return res
        .status(403)
        .json({ error: 'User does not have a current sponsor.' });
    }

    const sponsorId = user.currentSponsorId;

    logger.debug(`Fetching latest active slug for sponsor ID: ${sponsorId}`);
    const result = await prisma.bounties.findFirst({
      select: {
        slug: true,
      },
      where: {
        sponsorId,
        isPublished: true,
        isWinnersAnnounced: false,
        deadline: {
          gt: new Date(),
        },
        sponsor: {
          isVerified: true,
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    if (!result || !result.slug) {
      logger.warn(`No active bounty found for sponsor ID: ${sponsorId}`);
      return res.status(404).json({ error: 'No Active Bounty found' });
    }

    logger.info(
      `Successfully fetched latest active slug for user ID: ${userId}`,
    );
    return res.status(200).json(result.slug);
  } catch (error: any) {
    logger.error(
      `Error fetching latest active slug for user ${userId}: ${safeStringify(error)}`,
    );
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(latestActiveSlug);
