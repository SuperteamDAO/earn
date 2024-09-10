import type { NextApiResponse } from 'next';

import {
  checkListingSponsorAuth,
  type NextApiRequestWithSponsor,
  withSponsorAuth,
} from '@/features/auth';
import { sendEmailNotification } from '@/features/emails';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

async function scoutInvite(
  req: NextApiRequestWithSponsor,
  res: NextApiResponse,
) {
  const params = req.query;
  const id = params.id as string;
  const userId = params.userId as string;

  logger.debug(`Request query: ${safeStringify(req.query)}`);

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const sponsorUserId = req.userId;
    const userSponsorId = req.userSponsorId;

    const { error } = await checkListingSponsorAuth(userSponsorId, id);
    if (error) {
      return res.status(error.status).json({ error: error.message });
    }

    const scoutSponsor = await prisma.sponsors.findFirst({
      where: {
        id: userSponsorId,
      },
    });

    if (scoutSponsor?.isVerified === false) {
      logger.warn(`Sponsor isn't Verified, not sending scout data`);
      return res.status(401).send('Unauthorized');
    }

    const invitedCount = await prisma.scouts.count({
      where: {
        listingId: id,
        invited: true,
      },
    });

    if (invitedCount >= 10) {
      logger.warn(
        `Maximum number of invited scouts reached for listing ID: ${id}`,
      );
      return res.status(400).json({
        error: 'Maximum number of invited scouts reached',
      });
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
    sendEmailNotification({
      type: 'scoutInvite',
      id: id,
      userId,
      triggeredBy: sponsorUserId,
    });

    logger.debug(`Updating scout invitation status for scout ID: ${scout.id}`);
    await prisma.scouts.update({
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
    return res.status(200).json({ message: 'Success' });
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

export default withSponsorAuth(scoutInvite);
