import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

export default async function user(req: NextApiRequest, res: NextApiResponse) {
  const params = req.query;
  const slug = params.slug as string;
  logger.debug(`Request query: ${safeStringify(req.query)}`);

  if (!slug) {
    logger.warn('Slug is missing in the request query');
    return res.status(400).json({
      message: 'Slug is required in the request query.',
    });
  }

  try {
    logger.debug(`Fetching grant details for slug: ${slug}`);
    const grant = await prisma.grants.findFirst({
      where: {
        slug,
      },
      include: {
        sponsor: {
          select: {
            name: true,
            logo: true,
            isVerified: true,
          },
        },
        _count: {
          select: {
            GrantApplication: {
              where: {
                OR: [
                  {
                    applicationStatus: 'Approved',
                  },
                  {
                    applicationStatus: 'Completed',
                  },
                ],
              },
            },
          },
        },
      },
    });

    if (!grant) {
      logger.warn(`No grant found with slug: ${slug}`);
      return res.status(404).json({
        message: `No grant found with slug=${slug}.`,
      });
    }

    const totalApplications =
      grant._count.GrantApplication + grant.historicalApplications;

    logger.info(`Grant details fetched successfully for slug: ${slug}`);
    return res.status(200).json({
      ...grant,
      totalApplications,
    });
  } catch (error: any) {
    logger.error(
      `Error occurred while fetching grant with slug=${slug}: ${safeStringify(error)}`,
    );
    return res.status(500).json({
      error: error.message,
      message: `Error occurred while fetching grant with slug=${slug}.`,
    });
  }
}
