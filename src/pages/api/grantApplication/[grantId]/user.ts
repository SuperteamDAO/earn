import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { prisma } from '@/prisma';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const params = req.query;
  const grantId = params.grantId as string;
  const userId = req.userId;

  try {
    const result = await prisma.grantApplication.findFirst({
      where: {
        grantId,
        userId,
      },
    });
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      error,
      message: `Error occurred while fetching application of grant=${grantId} for user=${userId}.`,
    });
  }
}

export default withAuth(handler);
