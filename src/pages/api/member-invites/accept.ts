import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const { inviteId } = req.body;
  const userId = req.userId;

  logger.debug(`Request body: ${safeStringify(req.body)}`);
  logger.debug(`User ID: ${userId}`);

  if (!inviteId) {
    logger.warn('inviteId is required');
    return res.status(400).json({
      message: 'inviteId is required',
    });
  }

  try {
    logger.debug(`Checking user invite with ID: ${inviteId}`);
    const userInvite = await prisma.userInvites.findUnique({
      where: {
        id: inviteId,
      },
    });

    if (!userInvite) {
      logger.warn(`Invite not found for ID: ${inviteId}`);
      return res.status(404).json({
        message: 'Invite not found',
      });
    }

    const sponsorId = userInvite.sponsorId || '';
    const memberType = userInvite.memberType;

    logger.debug(
      `Creating user sponsor record for user ${userId} and sponsor ${sponsorId}`,
    );
    await prisma.userSponsors.create({
      data: {
        userId: userId as string,
        sponsorId,
        role: memberType,
      },
    });

    logger.debug(`Updating current sponsor ID for user ${userId}`);
    await prisma.user.update({
      where: {
        id: userId as string,
      },
      data: {
        currentSponsorId: sponsorId,
      },
    });

    logger.info(`User ${userId} successfully accepted invite ${inviteId}`);
    return res.status(200).json({ accepted: true });
  } catch (error: any) {
    logger.error(
      `User ${userId} unable to accept invite: ${safeStringify(error)}`,
    );
    return res.status(500).json({
      error: error.message,
      message: 'Error occurred while adding user to a sponsor',
    });
  }
}

export default withAuth(handler);
