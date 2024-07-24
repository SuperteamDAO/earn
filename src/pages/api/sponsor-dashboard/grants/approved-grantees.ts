import type { NextApiResponse } from 'next';

import {
  checkGrantSponsorAuth,
  type NextApiRequestWithSponsor,
  withSponsorAuth,
} from '@/features/auth';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

async function grantApplication(
  req: NextApiRequestWithSponsor,
  res: NextApiResponse,
) {
  const userId = req.userId;
  const params = req.query;
  const grantId = params.grantId as string;

  logger.info(
    `User ${userId} requested grant applications for grantId: ${grantId}`,
  );

  if (!grantId) {
    logger.warn(`Missing grantId in request by user ${userId}`);
    return res.status(400).json({ error: 'grantId is required' });
  }

  try {
    const { error } = await checkGrantSponsorAuth(req.userSponsorId, grantId);
    if (error) {
      return res.status(error.status).json({ error: error.message });
    }

    const result = await prisma.grantApplication.findMany({
      where: {
        grantId,
        applicationStatus: 'Approved',
      },
      include: {
        user: {
          select: {
            photo: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
      },
    });

    logger.info(
      `Found ${result.length} approved applications for grantId: ${grantId}`,
    );
    return res.status(200).json(result);
  } catch (error: any) {
    logger.error(
      `Error occurred while fetching applications for grantId: ${grantId} by user ${userId}: ${safeStringify(error)}`,
    );
    return res.status(500).json({
      error: error.message,
      message: 'Error occurred while fetching grant applications.',
    });
  }
}

export default withSponsorAuth(grantApplication);
