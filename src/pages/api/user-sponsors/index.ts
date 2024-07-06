import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;

  try {
    const result = await prisma.userSponsors.findMany({
      where: { userId },
      orderBy: {
        updatedAt: 'asc',
      },
      include: { sponsor: true },
    });
    return res.status(200).json(result);
  } catch (error) {
    logger.error(error);
    return res.status(400).json({
      error,
      message: 'Error occurred while adding a new sponsor.',
    });
  }
}

export default withAuth(handler);
