import { type Prisma } from '@prisma/client';
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
  const sponsor = params.sponsor as string;
  const listingId = params.listingId as string;

  const isUUID = listingId.includes('-');

  const isGod = req.authorized && req.role === 'GOD';
  const validation = isGod
    ? {}
    : { isPublished: true, isPrivate: false, isArchived: false };

  const sponsorWhere: Prisma.SponsorsWhereInput = isGod
    ? {
        slug: sponsor,
      }
    : {
        slug: sponsor,
        isArchived: false,
      };

  const where: Prisma.BountiesWhereInput = isUUID
    ? {
        id: listingId,
        sponsor: sponsorWhere,
      }
    : {
        sequentialId: parseInt(listingId),
        sponsor: sponsorWhere,
        ...validation,
      };

  logger.debug(`Request query: ${safeStringify(params)}`);

  if (!sponsor || !listingId) {
    logger.warn('Missing required query parameters: sponsor, listingId');
    return res.status(400).json({
      error: 'Missing required query parameters: sponsor, listingId',
    });
  }

  try {
    const result = await prisma.bounties.findFirst({
      where,
      include: {
        sponsor: {
          select: {
            name: true,
            logo: true,
            entityName: true,
            slug: true,
            isVerified: true,
            isCaution: true,
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
      logger.warn(
        `Bounty with sponsor=${sponsor} and listingId=${listingId} not found`,
      );
      return res.status(404).json({
        message: `Bounty with sponsor=${sponsor} and listingId=${listingId} not found.`,
      });
    }

    logger.info(
      `Successfully fetched bounty details for sponsor=${sponsor} and listingId=${listingId}`,
    );
    return res.status(200).json(result);
  } catch (error: any) {
    logger.error(
      `Error fetching bounty with sponsor=${sponsor} and listingId=${listingId}:`,
      safeStringify(error),
    );
    return res.status(500).json({
      error: error.message,
      message: `Error occurred while fetching bounty with sponsor=${sponsor} and listingId=${listingId}.`,
    });
  }
}

export default withPotentialSponsorAuth(handler);
