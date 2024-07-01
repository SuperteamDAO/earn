import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { prisma } from '@/prisma';

async function grantApplication(
  req: NextApiRequestWithUser,
  res: NextApiResponse,
) {
  const userId = req.userId;

  const params = req.query;

  const grantId = params.grantId as string;

  console.log(grantId);

  try {
    const result = await prisma.grantApplication.findMany({
      where: {
        grantId,
        applicationStatus: 'Approved',
      },
      include: {
        user: true,
      },
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error(`User ${userId} unable to apply`, error.message);
    return res.status(400).json({
      error,
      message: 'Error occurred while adding a new grant application.',
    });
  }
}

export default withAuth(grantApplication);
