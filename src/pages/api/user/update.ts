import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { filterAllowedFields } from '@/utils/filterAllowedFields';
import { safeStringify } from '@/utils/safeStringify';

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

    const allowedFields = ['featureModalShown', 'publicKey', 'acceptedTOS'];

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

    const result = await prisma.user.update({
      where: {
        id: userId as string,
      },
      data: updatedData,
      include: {
        currentSponsor: true,
        UserSponsors: true,
        Hackathon: true,
        Submission: true,
        emailSettings: true,
      },
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
