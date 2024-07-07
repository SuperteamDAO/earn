import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

async function grantDelete(req: NextApiRequestWithUser, res: NextApiResponse) {
  const params = req.query;
  const id = params.id as string;

  logger.debug(`Request query: ${safeStringify(req.query)}`);

  try {
    const userId = req.userId;

    logger.debug(`Fetching user details for user ID: ${userId}`);
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    logger.debug(`Fetching grant details for grant ID: ${id}`);
    const deleteGrant = await prisma.grants.findFirst({
      where: { id },
    });

    if (
      !user ||
      !user.currentSponsorId ||
      deleteGrant?.sponsorId !== user.currentSponsorId
    ) {
      logger.warn(
        `User ID: ${userId} does not have a current sponsor or is unauthorized to delete grant ID: ${id}`,
      );
      return res
        .status(403)
        .json({ error: 'User does not have a current sponsor.' });
    }

    if (!deleteGrant) {
      logger.warn(`Grant with ID: ${id} not found`);
      return res
        .status(404)
        .json({ message: `Grant with id=${id} not found.` });
    }

    if (deleteGrant.status !== 'OPEN' || deleteGrant.isPublished) {
      logger.warn(`Grant with ID: ${id} is not in a deletable state`);
      return res
        .status(400)
        .json({ message: 'Only draft bounties can be deleted' });
    }

    logger.debug(`Updating grant status to inactive for grant ID: ${id}`);
    await prisma.grants.update({
      where: { id },
      data: { isActive: false },
    });

    logger.info(`Grant with ID: ${id} deleted successfully`);
    return res
      .status(200)
      .json({ message: `Draft Bounty with id=${id} deleted successfully.` });
  } catch (error: any) {
    logger.error(
      `Error occurred while deleting grant with ID: ${id}: ${safeStringify(error)}`,
    );
    return res.status(400).json({
      error: error.message,
      message: `Error occurred while deleting bounty with id=${id}.`,
    });
  }
}

export default withAuth(grantDelete);
