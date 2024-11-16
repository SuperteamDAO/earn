import type { NextApiResponse } from 'next';

import {
  type NextApiRequestWithSponsor,
  withSponsorAuth,
} from '@/features/auth';
import { sponsorBaseSchema } from '@/features/sponsor';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  const userId = req.userId;

  try {
    const userSponsorId = req.userSponsorId;

    if (!userSponsorId) {
      logger.warn(`User ${userId} does not have a current sponsor`);
      return res
        .status(403)
        .json({ error: 'User does not have a current sponsor' });
    }

    logger.debug(`Request body: ${safeStringify(req.body)}`);

    const validationResult = sponsorBaseSchema.safeParse(req.body);

    if (!validationResult.success) {
      logger.warn(
        `Invalid sponsor data: ${safeStringify(validationResult.error)}`,
      );
      return res.status(400).json({
        error: 'Invalid sponsor data',
        details: validationResult.error.errors,
      });
    }

    const { name, slug, logo, url, industry, twitter, bio, entityName } =
      validationResult.data;

    const result = await prisma.sponsors.update({
      where: {
        id: userSponsorId,
      },
      data: {
        name,
        slug,
        logo,
        url,
        industry,
        twitter,
        bio,
        entityName,
      },
    });

    logger.info(`Sponsor updated successfully for user: ${userId}`);
    return res.status(200).json(result);
  } catch (error: any) {
    logger.error(
      `Error occurred while updating sponsor for user ${userId}: ${error.message}`,
    );
    return res.status(500).json({
      error: error.message || 'Internal server error',
      message: 'Error occurred while updating sponsor.',
    });
  }
}

export default withSponsorAuth(handler);
