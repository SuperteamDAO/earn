import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

export default async function getAllUsers(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  logger.debug(`Request body: ${safeStringify(req.body)}`);

  try {
    const { id } = req.body;

    if (!id) {
      logger.warn('User ID is missing in the request body');
      return res.status(400).json({ error: 'User ID is required' });
    }

    logger.debug(`Fetching user details for user ID: ${id}`);
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        photo: true,
      },
    });

    if (!user) {
      logger.warn(`User not found for user ID: ${id}`);
      return res.status(404).json({ error: 'User not found' });
    }

    logger.info(`User details fetched successfully for user ID: ${id}`);
    return res.status(200).json(user);
  } catch (error: any) {
    logger.error(
      `Error occurred while fetching user details: ${safeStringify(error)}`,
    );
    return res.status(500).json({ error: error.message });
  }
}
