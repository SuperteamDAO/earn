import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithSponsor } from '@/features/auth/types';
import { withSponsorAuth } from '@/features/auth/utils/withSponsorAuth';

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  const userId = req.userId;

  const params = req.query;
  const slug = params.slug as string;
  const type = params.type as 'bounty' | 'project' | 'hackathon';

  logger.debug(`Request query: ${safeStringify(params)}`);

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId as string,
      },
    });

    if (!user) {
      logger.warn(`Unauthorized access attempt by user ${userId}`);
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await prisma.bounties.findFirst({
      where: {
        slug,
        type,
        isActive: true,
      },
      include: {
        sponsor: {
          select: { name: true, logo: true, isVerified: true, st: true },
        },
        poc: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
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
            deadline: true,
            id: true,
          },
        },
      },
    });
    if (
      req.role !== 'GOD' &&
      result?.hackathonId &&
      result.hackathonId !== user.hackathonId
    ) {
      logger.warn(
        `Listing with slug=${slug} does not belong to user ${userId}`,
      );
      return res.status(403).json({
        message: `Listing with slug=${slug} does not belong to user ${userId}`,
      });
    }
    if (
      req.role !== 'GOD' &&
      result?.sponsorId &&
      result.sponsorId !== user.currentSponsorId
    ) {
      logger.warn(
        `Listing with slug=${slug} does not belong to user ${userId}`,
      );
      return res.status(403).json({
        message: `Listing with slug=${slug} does not belong to user ${userId}`,
      });
    }

    if (!result) {
      logger.warn(`Bounty with slug=${slug} not found for user ${userId}`);
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
    return res.status(400).json({
      error: error.message,
      message: `Error occurred while fetching bounty with slug=${slug}.`,
    });
  }
}

export default withSponsorAuth(handler);
