import type { NextApiResponse } from 'next';

import {
  checkGrantSponsorAuth,
  type NextApiRequestWithSponsor,
  withSponsorAuth,
} from '@/features/auth';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

async function grant(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  const params = req.query;
  const id = params.id as string;

  const { isPublished } = req.body;

  logger.debug(`Request body: ${safeStringify(req.body)}`);

  try {
    const userSponsorId = req.userSponsorId;

    const { error } = await checkGrantSponsorAuth(userSponsorId, id);
    if (error) {
      return res.status(error.status).json({ error: error.message });
    }

    logger.debug(`Updating grant with ID: ${id}`);
    const result = await prisma.grants.update({
      where: { id },
      data: { isPublished },
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

export default withSponsorAuth(grant);
