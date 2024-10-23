// user profile
import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

export default async function getAllUsers(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  logger.info(`Request body: ${safeStringify(req.body)}`);

  const { username } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        twitter: true,
        linkedin: true,
        github: true,
        website: true,
        username: true,
        workPrefernce: true,
        firstName: true,
        lastName: true,
        skills: true,
        photo: true,
        email: true,
        currentEmployer: true,
        location: true,
      },
    });

    if (!user) {
      logger.warn(
        `User not found for the provided criteria: ${safeStringify(req.body)}`,
      );
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
