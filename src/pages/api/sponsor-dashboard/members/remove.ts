import type { NextApiResponse } from 'next';

import {
  type NextApiRequestWithSponsor,
  withSponsorAuth,
} from '@/features/auth';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

async function removeMember(
  req: NextApiRequestWithSponsor,
  res: NextApiResponse,
) {
  const { id } = req.body;
  const userId = req.userId;
  const userSponsorId = req.userSponsorId;

  if (!userSponsorId) {
    logger.warn('Invalid token: User Sponsor Id is missing');
    return res.status(400).json({ error: 'Invalid token' });
  }

  logger.debug(`Request body: ${safeStringify(req.body)}`);

  try {
    logger.debug(`Fetching details for user with ID: ${userId}`);
    const user = await prisma.user.findUnique({
      where: { id: userId as string },
      select: {
        role: true,
      },
    });

    if (!user) {
      logger.warn(`Unauthorized request by user with ID: ${userId}`);
      return res.status(400).json({ error: 'Unauthorized' });
    }

    logger.debug(`Checking sponsor role for user with ID: ${userId}`);
    const userSponsor = await prisma.userSponsors.findUnique({
      where: {
        userId_sponsorId: {
          userId: userId as string,
          sponsorId: userSponsorId,
        },
      },
      select: { role: true },
    });

    if (user.role !== 'GOD' && (!userSponsor || userSponsor.role !== 'ADMIN')) {
      logger.warn(`Forbidden request by user with ID: ${userId}`);
      return res.status(403).json({ error: 'Forbidden' });
    }

    logger.debug(`Fetching member sponsor details for member with ID: ${id}`);
    const memberSponsor = await prisma.userSponsors.findUnique({
      where: {
        userId_sponsorId: {
          userId: id,
          sponsorId: userSponsorId,
        },
      },
      select: { role: true },
    });

    if (!memberSponsor) {
      logger.warn(`Member not found with ID: ${id}`);
      return res.status(404).json({ error: 'Member not found' });
    }

    logger.debug(`Deleting member sponsor record for member with ID: ${id}`);
    await prisma.userSponsors.delete({
      where: {
        userId_sponsorId: {
          userId: id,
          sponsorId: userSponsorId,
        },
      },
    });
    await prisma.user.update({
      where: {
        id,
        currentSponsorId: userSponsorId,
      },
      data: {
        currentSponsorId: null,
      },
    });

    logger.info(`Successfully removed member with ID: ${id}`);
    res.status(200).json({ message: 'Member removed successfully.' });
  } catch (error: any) {
    logger.error(`Error removing member: ${safeStringify(error)}`);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withSponsorAuth(removeMember);
