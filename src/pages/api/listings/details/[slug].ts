import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { convertDatesToISO, safeStringify } from '@/utils/safeStringify';

export async function getListingDetailsBySlug(slug: string): Promise<any> {
  if (!slug) {
    throw new Error('Missing required query parameters: slug');
  }

  const result = await prisma.bounties.findFirst({
    where: {
      slug,
      isActive: true,
    },
    include: {
      sponsor: {
        select: {
          name: true,
          logo: true,
          entityName: true,
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
          logo: true,
          altLogo: true,
          startDate: true,
          name: true,
          description: true,
          slug: true,
          announceDate: true,
          sponsorId: true,
          Sponsor: {
            select: {
              name: true,
              logo: true,
              entityName: true,
              isVerified: true,
              isCaution: true,
            },
          },
        },
      },
    },
  });

  return convertDatesToISO(result);
}

export default async function handler(
  req: NextApiRequest,
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

  try {
    const result = await getListingDetailsBySlug(slug);

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
