import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { verifyImageExists } from '@/utils/cloudinary';
import { safeStringify } from '@/utils/safeStringify';

import { userSelectOptions } from '@/features/auth/constants/userSelectOptions';
import { type NextApiRequestWithUser } from '@/features/auth/types';
import { withAuth } from '@/features/auth/utils/withAuth';
import { extractSocialUsername } from '@/features/social/utils/extractUsername';
import { userSponsorDetailsSchema } from '@/features/sponsor/utils/sponsorFormSchema';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;

  logger.debug(`Request body: ${safeStringify(req.body)}`);

  const { telegram, ...rest } = req.body;

  if (rest.photo && typeof rest.photo === 'string') {
    try {
      const imageExists = await verifyImageExists(rest.photo);
      if (!imageExists) {
        logger.warn(
          `Photo verification failed for user ${userId}: ${rest.photo}`,
        );
        return res.status(400).json({
          error: 'Invalid photo: Image does not exist in our storage',
        });
      }
      logger.info(
        `Photo verification successful for user ${userId}: ${rest.photo}`,
      );
    } catch (error: any) {
      logger.warn(
        `Photo verification error for user ${userId}: ${safeStringify(error)}`,
      );
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { photo: true },
      });
      rest.photo = existingUser?.photo || undefined;
    }
  }
  const telegramUsernameExtracted = extractSocialUsername('telegram', telegram);

  const dataToValidate = {
    ...rest,
    telegram: telegramUsernameExtracted,
  };

  try {
    const validationResult = userSponsorDetailsSchema.safeParse(dataToValidate);

    if (!validationResult.success) {
      logger.warn(
        `Invalid user details data: ${safeStringify(validationResult.error)}`,
      );
      return res.status(400).json({
        error: 'Invalid user details data',
        details: validationResult.error.issues,
      });
    }

    const { firstName, lastName, username, photo, telegram } =
      validationResult.data;

    logger.info(
      `Completing user sponsor profile with validated data: ${safeStringify({
        firstName,
        lastName,
        username,
        photo,
        telegram,
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
        telegram,
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
