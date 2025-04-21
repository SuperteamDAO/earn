import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithSponsor } from '@/features/auth/types';
import { withSponsorAuth } from '@/features/auth/utils/withSponsorAuth';

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  const userId = req.userId;
  const sponsorId = req.userSponsorId;

  logger.debug(`Request body: ${safeStringify(req.body)}`);
  logger.debug(`User ID: ${userId}, Sponsor ID: ${sponsorId}`);

  const { inviteId } = req.body;

  if (!inviteId) {
    logger.warn('Invite ID is required');
    return res.status(400).json({ error: 'Invite ID is required.' });
  }

  try {
    logger.debug(`Checking user authorization for user ID: ${userId}`);
    const userSponsor = await prisma.userSponsors.findUnique({
      where: {
        userId_sponsorId: {
          userId: userId as string,
          sponsorId: sponsorId as string,
        },
      },
    });

    if (!userSponsor && req.role !== 'GOD') {
      logger.warn(`Unauthorized access attempt by user ID: ${userId}`);
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (req.role !== 'GOD' && userSponsor?.role !== 'ADMIN') {
      logger.warn('Non-admin user attempted to remove invite');
      return res.status(403).json({ error: 'Only admins can remove invites' });
    }

    logger.debug(`Removing invite with ID: ${inviteId}`);
    await prisma.userInvites.delete({
      where: {
        id: inviteId,
        sponsorId: sponsorId as string,
      },
    });

    logger.info(`Invite ${inviteId} removed successfully by user ${userId}`);
    return res.status(200).json({ message: 'Invite removed successfully.' });
  } catch (error: any) {
    logger.error(
      `User ${userId} unable to remove invite: ${safeStringify(error)}`,
    );
    return res.status(500).json({
      error: error.message,
      message: 'Error occurred while removing the invite.',
    });
  }
}

export default withSponsorAuth(handler);
