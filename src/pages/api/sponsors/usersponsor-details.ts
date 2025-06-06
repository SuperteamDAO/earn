import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { userSelectOptions } from '@/features/auth/constants';
import { type NextApiRequestWithUser } from '@/features/auth/types';
import { withAuth } from '@/features/auth/utils/withAuth';
import { userSponsorDetailsSchema } from '@/features/sponsor/utils/sponsorFormSchema';

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

    const { name, username, photo } = validationResult.data;

    logger.info(
      `Completing user sponsor profile with validated data: ${safeStringify({
        name,
        username,
        photo,
      })}`,
    );

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        name,
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
