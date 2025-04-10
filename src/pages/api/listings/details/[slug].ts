import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithPotentialSponsor } from '@/features/auth/types';
import { withPotentialSponsorAuth } from '@/features/auth/utils/withPotentialSponsorAuth';

async function handler(
  req: NextApiRequestWithPotentialSponsor,
  res: NextApiResponse,
) {
  const params = req.query;
  const slug = params.slug as string;

  logger.debug(`Request query: ${safeStringify(params)}`);

  if (!slug) {
    logger.warn('Missing required query parameters: slug');
    return res.status(400).json({
      error: 'Missing required query parameters: slug',
    });
  }

  const isGod = req.authorized && req.role === 'GOD';
  const validation = isGod ? {} : { isActive: true };

  try {
    const result = await prisma.bounties.findFirst({
      where: {
        slug,
        ...validation,
      },
      include: {
        sponsor: {
          select: {
            name: true,
            logo: true,
            entityName: true,
            isVerified: true,
            isCaution: true,
            slug: true,
          },
        },
        poc: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            photo: true,
          },
        },
        Hackathon: {
          select: {
            altLogo: true,
            startDate: true,
            name: true,
            description: true,
            slug: true,
            announceDate: true,
          },
        },
      },
    });

    if (!result) {
      logger.warn(`Bounty with slug=${slug} not found`);
      return res.status(404).json({
        message: `Bounty with slug=${slug} not found.`,
      });
    }

    logger.info(`Successfully fetched bounty details for slug=${slug}`);
    return res.status(200).json(result);
  } catch (error: any) {
    logger.error(
      `Error fetching bounty with slug=${slug}:`,
      safeStringify(error),
    );
    return res.status(500).json({
      error: error.message,
      message: `Error occurred while fetching bounty with slug=${slug}.`,
    });
  }
}

export default withPotentialSponsorAuth(handler);
