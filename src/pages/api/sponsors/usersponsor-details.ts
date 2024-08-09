import type { NextApiResponse } from 'next';

import {
  type NextApiRequestWithUser,
  userSelectOptions,
  withAuth,
} from '@/features/auth';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;

  logger.debug(`Request body: ${safeStringify(req.body)}`);

  const { firstName, lastName, username, photo } = req.body;

  try {
    const data = {
      firstName,
      lastName,
      username,
      photo,
    };

    logger.info(
      `Completing user sponsor profile with data: ${safeStringify(data)}`,
    );

    await prisma.user.update({
      where: {
        id: userId,
      },
      data,
    });

    const result = await prisma.user.findUnique({
      where: { id: userId },
      select: userSelectOptions,
    });

    logger.info(`User onboarded successfully for user ID: ${userId}`);
    return res.status(200).json(result);
  } catch (error: any) {
    logger.error(
      `Error occurred while onboarding user ${userId}: ${safeStringify(error)}`,
    );
    return res.status(400).json({
      message: `Error occurred while updating user ${userId}: ${error.message}`,
    });
  }
}

export default withAuth(handler);
