import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const { grantId } = req.query;
  const userId = req.userId;

  logger.debug(`Request query: ${safeStringify(req.query)}`);

  try {
    const applications = await prisma.grantApplication.findMany({
      where: {
        grantId: grantId as string,
        userId: userId,
      },
    });

    logger.debug(
      `Fetched applications for grant ID: ${grantId} by user ID: ${userId}`,
    );

    const hasPendingApplication = applications.some(
      (application) =>
        (application.applicationStatus === 'Approved' &&
          !application.isShipped) ||
        application.applicationStatus === 'Pending',
    );

    logger.info(
      `Pending application status for user ID: ${userId} and grant ID: ${grantId}: ${hasPendingApplication}`,
    );
    res.status(200).json({ hasPendingApplication });
  } catch (error: any) {
    logger.error(
      `Error occurred while fetching applications for grant ID=${grantId} and user ID=${userId}: ${safeStringify(error)}`,
    );
    res.status(400).json({
      error: error.message,
      message: `Error occurred while fetching applications of grant=${grantId} for user=${userId}.`,
    });
  }
}

export default withAuth(handler);
