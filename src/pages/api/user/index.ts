import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

import { userSelectOptions } from '@/features/auth';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const token = await getToken({ req });

    if (!token) {
      logger.warn('Unauthorized request - No token provided');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userEmail = token.email;
    logger.debug(`Token retrieved, user email: ${userEmail}`);

    if (!userEmail) {
      logger.warn('Invalid token - No email found');
      return res.status(400).json({ error: 'Invalid token' });
    }

    const result = await prisma.user.findUnique({
      where: {
        email: userEmail,
      },
      select: userSelectOptions,
    });

    if (!result) {
      logger.warn(`User not found for email: ${userEmail}`);
      return res.status(404).json({ error: 'User not found' });
    }

    logger.info(`User data retrieved successfully: ${safeStringify(result)}`);
    return res.status(200).json(result);
  } catch (err) {
    logger.error(
      `Error occurred while processing the request: ${safeStringify(err)}`,
    );
    return res
      .status(500)
      .json({ error: 'Error occurred while processing the request.' });
  }
}
