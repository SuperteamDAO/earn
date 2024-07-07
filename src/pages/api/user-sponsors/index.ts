import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

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

    logger.info(`Fetched user sponsors for user ID: ${userId}`);
    return res.status(200).json(result);
  } catch (error: any) {
    logger.error(
      `Error occurred while fetching user sponsors for user ID: ${userId} - ${safeStringify(error)}`,
    );
    return res.status(400).json({
      error,
      message: 'Error occurred while fetching user sponsors.',
    });
  }
}

export default withAuth(handler);
