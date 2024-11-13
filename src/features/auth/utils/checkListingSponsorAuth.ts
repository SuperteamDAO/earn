import logger from '@/lib/logger';
import { prisma } from '@/prisma';

export const checkListingSponsorAuth = async (
  userSponsorId: string | undefined,
  listingId: string,
) => {
  if (!userSponsorId) {
    logger.warn('Invalid token: User Sponsor Id is missing');
    return { error: { status: 400, message: 'Invalid token' } };
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
      },
    };
  }

  return { listing };
};
