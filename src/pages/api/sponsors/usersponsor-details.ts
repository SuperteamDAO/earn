import type { NextApiResponse } from 'next';

import {
  type NextApiRequestWithUser,
  userSelectOptions,
  withAuth,
} from '@/features/auth';
import { userSponsorDetailsSchema } from '@/features/sponsor';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;

  logger.debug(`Request body: ${safeStringify(req.body)}`);

  try {
    const validationResult = userSponsorDetailsSchema.safeParse(req.body);

    if (!validationResult.success) {
      logger.warn(
        `Invalid user details data: ${safeStringify(validationResult.error)}`,
      );
      return res.status(400).json({
        error: 'Invalid user details data',
        details: validationResult.error.errors,
      });
    }

    const { firstName, lastName, username, photo } = validationResult.data;

    logger.info(
      `Completing user sponsor profile with validated data: ${safeStringify({
        firstName,
        lastName,
        username,
        photo,
      })}`,
    );

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        firstName,
        lastName,
        username,
        photo,
      },
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
    return res.status(500).json({
      error: 'Internal server error',
      message: `Error occurred while updating user: ${error.message}`,
    });
  }
}

export default withAuth(handler);
