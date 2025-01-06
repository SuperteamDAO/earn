import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithUser } from '@/features/auth/types';
import { withAuth } from '@/features/auth/utils/withAuth';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  logger.info(`Request query: ${safeStringify(req.query)}`);

  if (req.method !== 'GET') {
    logger.warn(`Method not allowed: ${req.method}`);
    return res.status(405).send('Method Not Allowed');
  }

  const { username, userId } = req.query;

  if (!username || typeof username !== 'string') {
    logger.warn('Invalid username parameter');
    return res
      .status(400)
      .json({ error: 'Username is required and must be a string.' });
  }

  try {
    logger.debug(`Checking availability for username: ${username}`);
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (user && user.id === userId) {
      logger.info(`Username ${username} is of same user`);
      return res.status(200).json({ available: true });
    }

    if (user) {
      logger.info(`Username ${username} is not available`);
      return res.status(200).json({ available: false });
    }

    logger.info(`Username ${username} is available`);
    return res.status(200).json({ available: true });
  } catch (error: any) {
    logger.error(
      `Error occurred while checking username availability: ${safeStringify(error)}`,
    );
    return res.status(500).json({
      error: 'Error occurred while checking the username availability.',
    });
  }
}

export default withAuth(handler);
