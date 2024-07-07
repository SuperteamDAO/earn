import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

async function grant(req: NextApiRequestWithUser, res: NextApiResponse) {
  const params = req.query;
  const id = params.id as string;
  const updatedData = req.body;

  logger.debug(`Request body: ${safeStringify(req.body)}`);

  try {
    const userId = req.userId;

    logger.debug(`Fetching user details for user ID: ${userId}`);
    const user = await prisma.user.findUnique({
      where: {
        id: userId as string,
      },
    });

    logger.debug(`Fetching grant details for grant ID: ${id}`);
    const grant = await prisma.grants.findUnique({
      where: { id },
    });

    if (!user) {
      logger.warn(`User with ID: ${userId} not found`);
      return res
        .status(403)
        .json({ error: 'User does not have a current sponsor.' });
    }

    if (!user.currentSponsorId || grant?.sponsorId !== user.currentSponsorId) {
      logger.warn(
        `User ID: ${userId} does not have a current sponsor or is unauthorized to update grant ID: ${id}`,
      );
      return res
        .status(403)
        .json({ error: 'User does not have a current sponsor.' });
    }

    if (!grant) {
      logger.warn(`Grant with ID: ${id} not found`);
      return res
        .status(404)
        .json({ message: `Grant with id=${id} not found.` });
    }

    logger.debug(`Updating grant with ID: ${id}`);
    const result = await prisma.grants.update({
      where: { id },
      data: updatedData,
    });

    logger.info(`Grant with ID: ${id} updated successfully`);
    return res.status(200).json(result);
  } catch (error: any) {
    logger.error(
      `Error occurred while updating grant with ID: ${id}: ${safeStringify(error)}`,
    );
    return res.status(400).json({
      error: error.message,
      message: `Error occurred while updating grant with id=${id}.`,
    });
  }
}

export default withAuth(grant);
