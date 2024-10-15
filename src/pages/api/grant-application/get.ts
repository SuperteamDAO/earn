import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';

async function application(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;
  const id = req.query.id as string;

  if (!id) {
    return res.status(400).json({
      message: 'Grant ID is required in the query parameters.',
    });
  }

  try {
    const result = await prisma.grantApplication.findFirst({
      where: {
        userId,
        grantId: id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!result) {
      return res.status(404).json({
        message: `Grant Application for user=${userId} and grantId=${id} not found.`,
      });
    }

    return res.status(200).json(result);
  } catch (error: any) {
    logger.error(
      `Error fetching Grant Application for user=${userId} and grantId=${id}: ${error.message}`,
    );
    return res.status(500).json({
      error: error.message,
      message: 'Error occurred while getting the grant application.',
    });
  }
}

export default withAuth(application);
