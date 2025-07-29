// used for api route, dont add use client here.
import { type Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';

import logger from '@/lib/logger';

import { type ListingWithSponsor } from '@/features/auth/utils/checkListingSponsorAuth';

export function isDraftable(
  listing:
    | Prisma.BountiesGetPayload<{
        include: {
          sponsor: true;
        };
      }>
    | undefined,
) {
  if (listing?.isPublished === true) {
    return {
      status: 403,
      error: 'Not Allowed',
      message: 'Published Listings are not allowed to be draft',
    };
  }
  if (
    listing &&
    listing?.status !== 'OPEN' &&
    listing?.status !== 'VERIFYING'
  ) {
    return {
      status: 403,
      error: 'Not Allowed',
      message: `Listing has status ${listing.status}, hence not allowed to edit`,
    };
  }
  return {
    status: 200,
    error: null,
    message: 'Draft allowed',
  };
}

// Helper function to validate draft permissions
export function validateDraftPermissions(
  listing?: ListingWithSponsor,
): NextResponse | null {
  const isDraftAllowed = isDraftable(listing);

  if (isDraftAllowed.error) {
    logger.warn(isDraftAllowed.message);
    return NextResponse.json(
      {
        error: isDraftAllowed.error,
        message: isDraftAllowed.message,
      },
      { status: isDraftAllowed.status },
    );
  }

  return null;
}
