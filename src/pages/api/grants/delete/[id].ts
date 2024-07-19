import type { NextApiResponse } from 'next';

import {
  checkGrantSponsorAuth,
  type NextApiRequestWithSponsor,
  withSponsorAuth,
} from '@/features/auth';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

async function grantDelete(
  req: NextApiRequestWithSponsor,
  res: NextApiResponse,
) {
  const params = req.query;
  const id = params.id as string;

  logger.debug(`Request query: ${safeStringify(req.query)}`);

  try {
    const userSponsorId = req.userSponsorId;

    const { error, grant } = await checkGrantSponsorAuth(userSponsorId, id);
    if (error) {
      return res.status(error.status).json({ error: error.message });
    }

    if (grant.status !== 'OPEN' || grant.isPublished) {
      logger.warn(`Grant with ID: ${id} is not in a deletable state`);
      return res
        .status(400)
        .json({ message: 'Only draft grants can be deleted' });
    }

    logger.debug(`Updating grant status to inactive for grant ID: ${id}`);
    await prisma.grants.update({
      where: { id },
      data: { isActive: false },
    });

    logger.info(`Grant with ID: ${id} deleted successfully`);
    return res
      .status(200)
      .json({ message: `Draft Grant with id=${id} deleted successfully.` });
  } catch (error: any) {
    logger.error(
      `Error occurred while deleting grant with ID: ${id}: ${safeStringify(error)}`,
    );
    return res.status(400).json({
      error: error.message,
      message: `Error occurred while deleting grant with id=${id}.`,
    });
  }
}

export default withSponsorAuth(grantDelete);
