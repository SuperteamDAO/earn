import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { filterAllowedFields } from '@/utils/filterAllowedFields';
import { safeStringify } from '@/utils/safeStringify';

import { userSelectOptions } from '@/features/auth/constants/userSelectOptions';
import { type NextApiRequestWithUser } from '@/features/auth/types';
import { withAuth } from '@/features/auth/utils/withAuth';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;

  logger.debug(`Request body: ${safeStringify(req.body)}`);

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId as string },
    });

    if (!user) {
      logger.warn(`User not found for user ID: ${userId}`);
      return res.status(404).json({ error: 'User not found' });
    }

    const allowedFields = ['featureModalShown', 'acceptedTOS'];

    if (user.role === 'GOD') {
      allowedFields.push('currentSponsorId', 'hackathonId');
    }

    const updatedData = filterAllowedFields(req.body, allowedFields);

    if (Object.keys(updatedData).length === 0) {
      logger.warn(`No valid fields provided for update for user ID: ${userId}`);
      return res
        .status(400)
        .json({ error: 'No valid fields provided for update' });
    }

    logger.info(`Updating user with data: ${safeStringify(updatedData)}`);

    await prisma.user.update({
      where: { id: userId as string },
      data: updatedData,
    });

    const result = await prisma.user.findUnique({
      where: { id: userId as string },
      select: userSelectOptions,
    });

    logger.info(`User updated successfully for user ID: ${userId}`);
    return res.status(200).json(result);
  } catch (error: any) {
    logger.error(
      `Error occurred while updating user ${userId}: ${safeStringify(error)}`,
    );
    return res.status(400).json({
      message: `Error occurred while updating user ${userId}: ${error.message}`,
    });
  }
}

export default withAuth(handler);
