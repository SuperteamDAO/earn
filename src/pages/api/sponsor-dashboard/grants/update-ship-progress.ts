import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';

import { type NextApiRequestWithSponsor } from '@/features/auth/types';
import { checkGrantSponsorAuth } from '@/features/auth/utils/checkGrantSponsorAuth';
import { withSponsorAuth } from '@/features/auth/utils/withSponsorAuth';
import { queueEmail } from '@/features/emails/utils/queueEmail';
import { grantApplicationMutationSelect } from '@/features/sponsor-dashboard/constants/grantApplicationMutation';

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { id } = req.body;

  if (!id || typeof id !== 'string') {
    logger.warn('Invalid request: ID is required and must be a string');
    return res
      .status(400)
      .json({ error: 'ID is required and must be a string' });
  }

  try {
    const currentApplication = await prisma.grantApplication.findUnique({
      where: { id },
      select: {
        grantId: true,
        userId: true,
        applicationStatus: true,
        grant: {
          select: {
            pocId: true,
          },
        },
      },
    });

    if (!currentApplication) {
      logger.warn(`Grant application with ID ${id} not found`);
      return res.status(404).json({ error: 'Grant application not found' });
    }

    const { error } = await checkGrantSponsorAuth(
      req.userSponsorId,
      currentApplication.grantId,
    );

    if (error) {
      return res.status(error.status).json({ error: error.message });
    }

    if (currentApplication.applicationStatus !== 'Approved') {
      return res
        .status(400)
        .json({ error: 'Only approved grant applications can be completed' });
    }

    const result = await prisma.grantApplication.update({
      where: { id },
      data: {
        applicationStatus: 'Completed',
      },
      select: grantApplicationMutationSelect,
    });

    if (!result) {
      logger.warn(`Grant application with ID ${id} not found`);
      return res.status(404).json({ error: 'Grant application not found' });
    }

    try {
      await queueEmail({
        type: 'grantCompleted',
        id: result.id,
        userId: currentApplication.userId,
        triggeredBy: currentApplication.grant.pocId,
      });
    } catch (err) {
      logger.error(
        `Failed to send email for grant completed notification for application ID ${result.id}: ${err}`,
      );
    }

    return res.status(200).json(result);
  } catch (error: any) {
    logger.error(
      `Error updating grant application with ID ${id}: ${error.message}`,
    );
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Error occurred while updating the grant application.',
    });
  }
}

export default withSponsorAuth(handler);
