// used for api route, dont add use client here.
import { NextResponse } from 'next/server';

import logger from '@/lib/logger';
import { type UserModel } from '@/prisma/models/User';

import { type ListingWithSponsor } from '@/features/auth/utils/checkListingSponsorAuth';
import { isDeadlineOver } from '@/features/listings/utils/deadline';

export function validateUpdatePermissions(
  listing: ListingWithSponsor,
  user: UserModel,
) {
  const isGod = user?.role === 'GOD';
  const isLinkedChapterSponsorMember = Boolean(listing?.sponsor?.chapter?.id);
  const pastDeadline = isDeadlineOver(listing?.deadline ?? undefined);

  logger.info('Check for past deadline of listing', {
    id: listing.id,
    pastDeadline,
    deadline: listing?.deadline,
    isLinkedChapterSponsorMember,
    isWinnersAnnounced: listing?.isWinnersAnnounced,
  });

  if (isGod) return null;

  if (isLinkedChapterSponsorMember && listing?.isWinnersAnnounced) {
    logger.warn('Listing winners are announced, hence cannot be edited', {
      id: listing.id,
      isLinkedChapterSponsorMember,
    });
    return NextResponse.json(
      { message: 'Listing winners are announced, hence cannot be edited' },
      { status: 400 },
    );
  }

  if (pastDeadline && !isLinkedChapterSponsorMember) {
    logger.warn('Listing is past deadline, hence cannot be edited', {
      id: listing.id,
      isLinkedChapterSponsorMember,
      isWinnersAnnounced: listing?.isWinnersAnnounced,
    });
    return NextResponse.json(
      { message: 'Listing is past deadline, hence cannot be edited' },
      { status: 400 },
    );
  }
  if (!listing.isPublished) {
    logger.warn('Listing is not published, hence cannot be edited', {
      id: listing.id,
    });
    return NextResponse.json(
      { message: 'Listing is not published, hence cannot be edited' },
      { status: 400 },
    );
  }

  return null;
}
