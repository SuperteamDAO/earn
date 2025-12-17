import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { convertDatesToISO, safeStringify } from '@/utils/safeStringify';

import { getPrivyToken } from '@/features/auth/utils/getPrivyToken';

interface ListingWithProFlag {
  readonly isPro?: boolean;
  // The following fields are intentionally loose, as they are
  // coming directly from Prisma without a strict type.
  description?: string | null;
  eligibility?: unknown;
  requirements?: string | null;
  commitmentDate?: string | null;
  applicationLink?: string | null;
  references?: unknown;
  Hackathon?: {
    description?: string | null;
    eligibility?: unknown;
    // Allow any additional hackathon fields without typing them here.

    [key: string]: any;
  } | null;
  // Allow any additional listing fields without typing them here.

  [key: string]: any;
}

const SENSITIVE_LISTING_FIELDS: ReadonlyArray<keyof ListingWithProFlag> = [
  'description',
  'eligibility',
  'requirements',
  'commitmentDate',
  'applicationLink',
  'references',
];

const sanitizeListingForViewer = <TListing extends ListingWithProFlag>(
  listing: TListing | null,
  viewerIsPro: boolean,
): TListing | null => {
  if (!listing || listing.isPro !== true || viewerIsPro) {
    return listing;
  }

  const sanitizedListing: ListingWithProFlag = { ...listing };

  for (const field of SENSITIVE_LISTING_FIELDS) {
    if (field in sanitizedListing) {
      // We prefer `null` over `undefined` so JSON shape remains stable.

      (sanitizedListing as any)[field] = null;
    }
  }

  if (sanitizedListing.Hackathon) {
    sanitizedListing.Hackathon = {
      ...sanitizedListing.Hackathon,
      description: null,
      eligibility: null,
    };
  }

  return sanitizedListing as TListing;
};

export async function getListingDetailsBySlug(
  slug: string,
  options?: { viewerIsPro?: boolean },
): Promise<any> {
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
          slug: true,
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

  const listingWithIsoDates = convertDatesToISO(
    result,
  ) as ListingWithProFlag | null;

  const viewerIsPro = options?.viewerIsPro ?? false;

  return sanitizeListingForViewer(listingWithIsoDates, viewerIsPro);
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
    const privyDid = await getPrivyToken(req);

    let viewerIsPro = false;

    if (privyDid) {
      const viewer = await prisma.user.findUnique({
        where: { privyDid },
        select: { isPro: true },
      });

      viewerIsPro = viewer?.isPro ?? false;
    }

    const result = await getListingDetailsBySlug(slug, { viewerIsPro });

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
