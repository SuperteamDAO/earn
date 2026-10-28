import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { getErrorMessage } from '@/utils/getErrorMessage';

import { type NextApiRequestWithUser } from '@/features/auth/types';
import { withAuth } from '@/features/auth/utils/withAuth';

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
  } catch (error) {
    logger.error(
      `Error occurred while fetching user ${userId}: ${getErrorMessage(error)}`,
    );
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Error occurred while fetching user.',
    });
  }
}

export default withAuth(user);
