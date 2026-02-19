import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import {
  type ListingWithSponsor,
  validateListingSponsorAuth,
} from '@/features/auth/utils/checkListingSponsorAuth';
import { validateSession } from '@/features/auth/utils/getSponsorSession';
import { buildListingContext } from '@/features/listing-builder/utils/contextBuilder';
import { transformToPrismaData } from '@/features/listing-builder/utils/listingTransformationPipe';
import { validateListing } from '@/features/listing-builder/utils/listingValidator';
import { handlePostSaveOperations } from '@/features/listing-builder/utils/postListingSaveOperation';
import { sponsorVerificationCheck } from '@/features/listing-builder/utils/sponsorVerification';

function publishPermissionsCheck(
  listing: ListingWithSponsor,
): NextResponse | null {
  if (listing.isPublished) {
    return NextResponse.json(
      {
        message:
          'Listing is already published, hence cannot be published again',
      },
      { status: 400 },
    );
  }
  return null;
}

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  const id = params.id;
  try {
    const sessionResult = await validateSession(await headers());
    if ('error' in sessionResult) {
      return sessionResult.error;
    }
    const { userId, userSponsorId } = sessionResult.session;

    const listingAuthResult = await validateListingSponsorAuth(
      userSponsorId,
      id,
    );
    if ('error' in listingAuthResult) {
      return listingAuthResult.error;
    }
    const listing = listingAuthResult.listing;
    const previouslyPublishedListingsCount = await prisma.bounties.count({
      where: {
        sponsorId: userSponsorId,
        publishedAt: {
          not: null,
        },
      },
    });

    const body = await request.json();
    logger.debug(`Request body: ${safeStringify(body)}`);

    const publishNotAllowed = publishPermissionsCheck(listing);
    if (publishNotAllowed) {
      return publishNotAllowed;
    }

    const { hackathon, sponsor, user } = await buildListingContext({
      listing,
      userId,
      hackathonId: body.hackathonId,
    });

    const validatedData = await validateListing({
      listing,
      sponsor,
      user,
      hackathon,
      isEditing: false,
      formData: body,
    });

    const { reason, isVerifying } = await sponsorVerificationCheck({
      sponsor,
      listing,
      user,
      validatedListing: validatedData,
    });

    logger.info(
      `Final verification status for sponsor ${userSponsorId}: ${isVerifying}`,
      {
        id: listing.id,
        isVerifying,
        sponsorId: userSponsorId,
        reasons: {
          isCautioned: sponsor?.isCaution,
          isUnverified: !sponsor?.isVerified,
          isNotGodUser: user?.role !== 'GOD',
        },
        finalReason: reason,
      },
    );

    if (isVerifying) {
      logger.info(`Setting listing to verification mode`, {
        id: listing.id,
        sponsorId: userSponsorId,
        userId,
      });
    }

    const data = await transformToPrismaData({
      validatedListing: validatedData,
      listing,
      sponsor,
      isVerifying,
      isEditing: false,
      userId,
    });
    logger.debug(`Publishing listing with data: ${safeStringify(data)}`, {
      id,
      data,
    });

    const result = await prisma.bounties.update({
      where: { id },
      data,
    });
    logger.debug(`Publish Listing Successful`, { id });
    const isFirstPublishedListing =
      result.isPublished && previouslyPublishedListingsCount === 0;

    await handlePostSaveOperations({
      result,
      originalListing: listing,
      userId,
      isEditing: false,
      isVerifying,
      reason,
    });

    logger.info(`Listing Publish API Fully Successful with ID: ${id}`);
    return NextResponse.json(
      {
        ...result,
        reason,
        isFirstPublishedListing,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.log('error', error);
    logger.error(
      `User ${typeof error?.userId !== 'undefined' ? error.userId : ''} unable to publish a listing: ${safeStringify(error)}`,
    );
    return NextResponse.json(
      {
        error: error.message,
        message: 'Error occurred while publishing a Listing.',
      },
      { status: 500 },
    );
  }
}
