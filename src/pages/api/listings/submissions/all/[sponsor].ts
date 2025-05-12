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
  const sponsorSlug = params.sponsor as string;
  const status = params.status as string;

  const isGod = req.authorized && req.role === 'GOD';
  const validation = isGod ? {} : { isActive: true, isArchived: false };

  logger.debug(`Request query: ${safeStringify(req.query)}`);
  let statusFilter: Prisma.SubmissionWhereInput;
  switch (status?.toLowerCase()) {
    case 'paid':
      statusFilter = { isPaid: true };
      break;
    case 'approved':
      statusFilter = { status: 'Approved' };
      break;
    case 'pending':
      statusFilter = { status: 'Pending' };
      break;
    case 'rejected':
      statusFilter = { status: 'Rejected' };
      break;
    default:
      statusFilter = {};
      break;
  }

  try {
    logger.debug(
      `Fetching submissions with sponsor slug: ${sponsorSlug}, isGod: ${isGod}`,
    );
    const result = await prisma.submission.findMany({
      where: {
        listing: {
          sponsor: {
            slug: sponsorSlug,
          },
          isPrivate: isGod ? undefined : false,
          ...validation,
        },
        ...validation,
        ...statusFilter,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            publicKey: true,
            photo: true,
            username: true,
          },
        },
        listing: {
          select: {
            eligibility: true,
          },
        },
      },
      orderBy: {
        sequentialId: 'desc',
      },
    });

    if (!result) {
      logger.warn(`No submissions found with sponsor slug: ${sponsorSlug}`);
      return res.status(404).json({
        message: `No submissions found with sponsor slug=${sponsorSlug}.`,
      });
    }

    return res.status(200).json(result);
  } catch (error: any) {
    logger.error(
      `Error occurred while fetching submissions with sponsor slug=${sponsorSlug}: ${safeStringify(error)}`,
    );
    return res.status(400).json({
      error: error.message,
      message: `Error occurred while fetching submissions with sponsor slug=${sponsorSlug}.`,
    });
  }
}

export default withPotentialSponsorAuth(handler);
