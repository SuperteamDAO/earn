// user profile
import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

export default async function getAllUsers(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  logger.info(`Request body: ${safeStringify(req.query)}`);

  const { email } = req.query;
  if (typeof email !== 'string') {
    return res.status(400).json({ error: 'Email can only be a string' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
      },
    });

    if (!user) {
      logger.warn(`User does not exist for email ${email}`);
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = user.id;
    logger.info(`User found: ${userId}`);
    return res.status(200).json({ ...user });
  } catch (error: any) {
    logger.error(`Error fetching user details: ${safeStringify(error)}`);
    return res
      .status(500)
      .json({ error: `Unable to fetch user details: ${error.message}` });
  }
}
