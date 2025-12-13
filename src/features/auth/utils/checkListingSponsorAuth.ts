import { NextResponse } from 'next/server';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { type BountiesGetPayload } from '@/prisma/models/Bounties';

export type ListingWithSponsor = BountiesGetPayload<{
  include: { sponsor: true };
}>;

export const checkListingSponsorAuth = async (
  userSponsorId: string | undefined,
  listingId: string,
): Promise<
  | { listing: ListingWithSponsor; error?: undefined }
  | {
      error: { status: number; message: string; sponsorId?: string };
      listing?: undefined;
    }
> => {
  if (!userSponsorId) {
    logger.warn('Invalid token: User Sponsor Id is missing');
    return {
      error: { status: 400, message: 'Invalid token' },
    };
  }

  const listing = await prisma.bounties.findUnique({
    where: { id: listingId },
    include: { sponsor: true },
  });

  if (!listing) {
    logger.warn(`Listing with ID: ${listingId} not found`);
    return {
      error: {
        status: 404,
        message: `Listing with id=${listingId} not found.`,
      },
    };
  }

  if (listing.sponsorId !== userSponsorId) {
    logger.warn(
      `User's sponsor ID does not match listings's sponsor ID for listing ID: ${listingId}`,
    );
    return {
      error: {
        status: 403,
        message: 'User is not authorized to perform this action.',
        sponsorId: listing.sponsorId,
      },
    };
  }

  return { listing };
};

// Helper function to handle listing auth validation in app router routes
export async function validateListingSponsorAuth(
  userSponsorId: string,
  listingId: string,
): Promise<{ listing: ListingWithSponsor } | { error: NextResponse }> {
  const result = await checkListingSponsorAuth(userSponsorId, listingId);

  if (result.error) {
    return {
      error: NextResponse.json(
        { error: result.error.message },
        { status: result.error.status },
      ),
    };
  }

  return { listing: result.listing };
}
