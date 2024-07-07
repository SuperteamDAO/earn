import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { sendEmailNotification } from '@/features/emails';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

async function scoutInvite(req: NextApiRequestWithUser, res: NextApiResponse) {
  const params = req.query;
  const id = params.id as string;
  const userId = params.userId as string;

  logger.debug(`Request query: ${safeStringify(req.query)}`);

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    logger.debug(`Fetching bounty with ID: ${id}`);
    const scoutBounty = await prisma.bounties.findFirst({
      where: {
        id,
      },
    });

    if (scoutBounty === null) {
      logger.warn(`Bounty with ID: ${id} not found`);
      return res.status(404).send('Bounty Not Found');
    }

    const sponsorUserId = req.userId;
    logger.debug(`Fetching user details for user ID: ${sponsorUserId}`);
    const user = await prisma.user.findUnique({
      where: {
        id: sponsorUserId,
      },
    });

    if (scoutBounty?.sponsorId !== user?.currentSponsorId) {
      logger.warn(
        `User ID: ${sponsorUserId} is not authorized to invite scouts for bounty ID: ${id}`,
      );
      return res
        .status(403)
        .send(`Bounty doesn't belong to requesting sponsor`);
    }

    logger.debug(`Fetching scout for listing ID: ${id} and user ID: ${userId}`);
    const scout = await prisma.scouts.findFirst({
      where: {
        listingId: id,
        userId: userId,
      },
    });

    if (!scout) {
      logger.warn(
        `Scout not found for listing ID: ${id} and user ID: ${userId}`,
      );
      return res.status(404).send('Scout Not Found');
    }

    logger.debug(
      `Sending scout invite email for listing ID: ${id} and user ID: ${userId}`,
    );
    await sendEmailNotification({
      type: 'scoutInvite',
      id: id,
      userId,
      triggeredBy: sponsorUserId,
    });

    logger.debug(`Updating scout invitation status for scout ID: ${scout.id}`);
    const updateScout = await prisma.scouts.update({
      where: {
        id: scout.id,
      },
      data: {
        invited: true,
      },
    });

    logger.info(
      `Scout invitation sent successfully for listing ID: ${id} and user ID: ${userId}`,
    );
    return res.status(200).json(updateScout);
  } catch (error: any) {
    logger.error(
      `Error occurred while inviting scout user=${userId} for bounty with id=${id}: ${safeStringify(error)}`,
    );
    return res.status(400).json({
      error: error.message,
      message: `Error occurred while inviting scout user=${userId} for bounty with id=${id}.`,
    });
  }
}

export default withAuth(scoutInvite);
