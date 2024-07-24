import type { NextApiResponse } from 'next';

import {
  checkListingSponsorAuth,
  type NextApiRequestWithSponsor,
  withSponsorAuth,
} from '@/features/auth';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

async function bountyDelete(
  req: NextApiRequestWithSponsor,
  res: NextApiResponse,
) {
  const params = req.query;
  const id = params.id as string;

  logger.debug(`Request query: ${safeStringify(req.query)}`);

  try {
    const userSponsorId = req.userSponsorId;

    const { error, listing } = await checkListingSponsorAuth(userSponsorId, id);
    if (error) {
      return res.status(error.status).json({ error: error.message });
    }

    if (listing.status !== 'OPEN' || listing.isPublished) {
      logger.warn(`Bounty with ID: ${id} is not in a deletable state`);
      return res
        .status(400)
        .json({ message: 'Only draft bounties can be deleted' });
    }

    logger.debug(`Updating bounty status to inactive for bounty ID: ${id}`);
    await prisma.bounties.update({
      where: { id },
      data: { isActive: false },
    });

    logger.info(`Draft bounty with ID: ${id} deleted successfully`);
    return res
      .status(200)
      .json({ message: `Draft Bounty with id=${id} deleted successfully.` });
  } catch (error: any) {
    logger.error(
      `Error occurred while deleting bounty with ID: ${id}: ${safeStringify(error)}`,
    );
    return res.status(400).json({
      error: error.message,
      message: `Error occurred while deleting bounty with id=${id}.`,
    });
  }
}

export default withSponsorAuth(bountyDelete);
