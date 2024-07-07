import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

export default async function checkUsername(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  logger.info(`Request query: ${safeStringify(req.query)}`);

  if (req.method !== 'GET') {
    logger.warn(`Method not allowed: ${req.method}`);
    return res.status(405).end('Method Not Allowed');
  }

  const { username } = req.query;

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
    });

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
