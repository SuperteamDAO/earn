import type { NextApiResponse } from 'next';

import {
  checkGrantSponsorAuth,
  type NextApiRequestWithSponsor,
  withSponsorAuth,
} from '@/features/auth';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  const userId = req.userId;

  logger.debug(`Request query: ${safeStringify(req.query)}`);

  const params = req.query;
  const slug = params.slug as string;

  try {
    logger.info(`Fetching grant details for slug: ${slug} for user: ${userId}`);

    const grant = await prisma.grants.findFirst({
      where: { slug },
      include: { sponsor: true, poc: true, GrantApplication: true },
    });

    if (!grant) {
      logger.info(`Grant with slug=${slug} not found for user=${userId}`);
      return res.status(404).json({
        message: `Grant with slug=${slug} not found.`,
      });
    }

    const { error } = await checkGrantSponsorAuth(req.userSponsorId, grant.id);
    if (error) {
      return res.status(error.status).json({ error: error.message });
    }

    const totalApplications = grant.GrantApplication.length;

    logger.info(`Grant details fetched successfully for slug=${slug}`);
    return res.status(200).json({
      ...grant,
      totalApplications,
    });
  } catch (error: any) {
    logger.error(
      `Error fetching grant with slug=${slug} for user=${userId}: ${safeStringify(error)}`,
    );
    return res.status(400).json({
      error: error.message,
      message: `Error occurred while fetching grant with slug=${slug}.`,
    });
  }
}

export default withSponsorAuth(handler);
