import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { convertDatesToISO, safeStringify } from '@/utils/safeStringify';

import { publicListingDetailsSelect } from '@/features/listings/constants/publicListingDetails';
import { type PublicListingDetails } from '@/features/listings/types';

export async function getListingDetailsBySlug(
  slug: string,
  options: {
    canViewAllUnpublished?: boolean;
    unpublishedSponsorIds?: string[];
  } = {},
): Promise<PublicListingDetails | null> {
  if (!slug) {
    throw new Error('Missing required query parameters: slug');
  }

  const result = await prisma.bounties.findFirst({
    where: {
      slug,
      isActive: true,
      isArchived: false,
      ...(options.canViewAllUnpublished
        ? {
            OR: [{ isPublished: true }, { isPublished: false }],
          }
        : options.unpublishedSponsorIds?.length
          ? {
              OR: [
                { isPublished: true },
                { sponsorId: { in: options.unpublishedSponsorIds } },
              ],
            }
          : { isPublished: true }),
    },
    select: publicListingDetailsSelect,
  });

  return convertDatesToISO(result) as unknown as PublicListingDetails | null;
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
