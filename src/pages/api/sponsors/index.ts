import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';

async function user(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId as string,
      },
      include: {
        currentSponsor: true,
      },
    });

    if (!user) {
      logger.warn(`User not found: ${userId}`);
      return res.status(404).json({ error: 'User not found' });
    }

    logger.info(`Fetched current sponsor for user: ${userId}`);
    return res.status(200).json(user.currentSponsor);
  } catch (error: any) {
    logger.error(
      `Error occurred while fetching user ${userId}: ${error.message}`,
    );
    return res.status(500).json({
      error: error.message || 'Internal server error',
      message: 'Error occurred while fetching user.',
    });
  }
}

export default withAuth(user);
