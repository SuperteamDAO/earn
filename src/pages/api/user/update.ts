import type { NextApiResponse } from 'next';

import { CHAIN_NAME } from '@/constants/project';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { filterAllowedFields } from '@/utils/filterAllowedFields';
import { safeStringify } from '@/utils/safeStringify';
import { validateNearAddress } from '@/utils/validateNearAddress';

import { userSelectOptions } from '@/features/auth/constants';
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

    const allowedFields = [
      'currentSponsorId',
      'featureModalShown',
      'publicKey',
      'acceptedTOS',
    ];

    if (user.role === 'GOD') {
      allowedFields.push('hackathonId');
    }

    const updatedData = filterAllowedFields(req.body, allowedFields);

    if (Object.keys(updatedData).length === 0) {
      logger.warn(`No valid fields provided for update for user ID: ${userId}`);
      return res
        .status(400)
        .json({ error: 'No valid fields provided for update' });
    }

    if ('publicKey' in updatedData) {
      const walletValidation = validateNearAddress(updatedData.publicKey);

      if (!walletValidation.isValid) {
        logger.warn(`Invalid public key provided for user ID: ${userId}`);
        return res.status(400).json({
          error: 'Invalid Wallet Address',
          message:
            walletValidation.error ||
            `Invalid ${CHAIN_NAME} wallet address provided.`,
        });
      }
    }

    if (updatedData.currentSponsorId && user.role !== 'GOD') {
      const sponsor = await prisma.userSponsors.findUnique({
        where: {
          userId_sponsorId: {
            userId: userId as string,
            sponsorId: updatedData.currentSponsorId as string,
          },
        },
      });

      if (!sponsor) {
        logger.warn(`Sponsor not found for user ID: ${userId}`);
        return res.status(404).json({ error: 'Sponsor not found' });
      }
    }

    logger.info(`Updating user with data: ${safeStringify(updatedData)}`);

    const result = await prisma.user.update({
      where: {
        id: userId as string,
      },
      data: updatedData,
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
