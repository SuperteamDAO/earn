import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;

  logger.debug(`Request query: ${safeStringify(req.query)}`);

  const user = await prisma.user.findUnique({
    where: {
      id: userId as string,
    },
  });

  if (!user) {
    logger.warn(`Unauthorized access attempt by user ID: ${userId}`);
    return res.status(400).json({ error: 'Unauthorized' });
  }

  const params = req.query;
  const slug = params.slug as string;

  try {
    logger.info(`Fetching grant details for slug: ${slug} for user: ${userId}`);

    const result = await prisma.grants.findFirst({
      where: {
        slug,
        sponsor: {
          id: user.currentSponsorId!,
        },
      },
      include: { sponsor: true, poc: true, GrantApplication: true },
    });

    if (!result) {
      logger.info(`Grant with slug=${slug} not found for user=${userId}`);
      return res.status(404).json({
        message: `Grant with slug=${slug} not found.`,
      });
    }

    const totalApplications = result.GrantApplication.length;

    logger.info(`Grant details fetched successfully for slug=${slug}`);
    return res.status(200).json({
      ...result,
      totalApplications,
    });
  } catch (error: any) {
    logger.error(
      `Error fetching grant with slug=${slug} for user=${userId}`,
      safeStringify(error),
    );
    return res.status(400).json({
      error: error.message,
      message: `Error occurred while fetching grant with slug=${slug}.`,
    });
  }
}

export default withAuth(handler);
