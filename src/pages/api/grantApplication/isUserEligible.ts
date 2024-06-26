import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { prisma } from '@/prisma';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const { grantId } = req.query;
  const userId = req.userId;

  try {
    const applications = await prisma.grantApplication.findMany({
      where: {
        grantId: grantId as string,
        userId: userId,
      },
    });

    const hasPendingApplication = applications.some(
      (application) =>
        application.applicationStatus === 'Approved' && !application.isShipped,
    );

    res.status(200).json({ hasPendingApplication });
  } catch (error) {
    res.status(400).json({
      error,
      message: `Error occurred while fetching applications of grant=${grantId} for user=${userId}.`,
    });
  }
}

export default withAuth(handler);
