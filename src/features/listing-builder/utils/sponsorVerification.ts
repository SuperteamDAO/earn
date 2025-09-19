import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { type BountyType } from '@/prisma/enums';
import { type SponsorsModel } from '@/prisma/models/Sponsors';
import { type UserModel } from '@/prisma/models/User';
import { dayjs } from '@/utils/dayjs';

import { type ListingWithSponsor } from '@/features/auth/utils/checkListingSponsorAuth';

import { type ListingFormData } from '../types';

export interface SponsorVerificationResult {
  isVerifying: boolean;
  reason: string;
}

const shouldVerifyHackathonListing = (type: BountyType): boolean =>
  type === 'hackathon';

const shouldSkipVerification = (
  sponsor: { isVerified: boolean },
  user: { role: string },
): boolean => sponsor.isVerified || user?.role === 'GOD';

const checkCautionStatus = (sponsor: {
  isCaution: boolean;
}): SponsorVerificationResult => ({
  isVerifying: sponsor.isCaution,
  reason: sponsor.isCaution ? 'Sponsor marked as caution' : '',
});

const checkNewSponsorStatus = async (
  sponsorId: string,
): Promise<SponsorVerificationResult> => {
  logger.debug(
    `Checking if sponsor had a live listing with sponsor id ${sponsorId}`,
  );

  const listingCount = await prisma.bounties.count({
    where: {
      sponsorId,
      isArchived: false,
      isPublished: true,
      isActive: true,
    },
  });

  const isNewSponsor = listingCount === 0;
  let reason = isNewSponsor ? 'New sponsor' : '';

  if (isNewSponsor) {
    const prevUnpublished = await prisma.bounties.count({
      where: {
        sponsorId,
        isArchived: false,
        isPublished: false,
        isActive: true,
        publishedAt: { not: null },
      },
    });

    if (prevUnpublished > 0) {
      reason = 'Has unannounced winners';
    }

    logger.debug('Sponsor live listing & prev unpublished check result', {
      sponsorId,
      listingCount,
      hadNoLiveListing: isNewSponsor,
      prevUnpublished: prevUnpublished > 0,
    });
  }

  return { isVerifying: isNewSponsor, reason };
};

const checkOverdueListings = async (
  sponsorId: string,
): Promise<SponsorVerificationResult> => {
  const twoWeeksAgo = dayjs().subtract(2, 'weeks');

  logger.debug('Checking for overdue bounties', {
    sponsorId,
    checkDate: twoWeeksAgo.toISOString(),
  });

  const overdueListing = await prisma.bounties.findFirst({
    select: { id: true },
    where: {
      sponsorId,
      isArchived: false,
      isPublished: true,
      isActive: true,
      isWinnersAnnounced: false,
      deadline: {
        lt: twoWeeksAgo.toDate(),
      },
    },
  });

  const hasOverdue = !!overdueListing;

  logger.debug('Overdue listing check result', {
    sponsorId,
    hasOverdueListing: hasOverdue,
    overdueListingId: overdueListing?.id,
  });

  return {
    isVerifying: hasOverdue,
    reason: hasOverdue ? 'Has unannounced winners' : '',
  };
};

interface SponsorVerificationProps {
  sponsor: SponsorsModel;
  listing: ListingWithSponsor;
  user: UserModel;
  validatedListing: ListingFormData;
}
export const sponsorVerificationCheck = async ({
  sponsor,
  listing,
  user,
  validatedListing,
}: SponsorVerificationProps): Promise<SponsorVerificationResult> => {
  if (process.env.IS_EARN_BASE !== 'true') {
    // dont want OSS users to see this verification status. IS_EARN_BASE is a valid env variable for only us.
    return { isVerifying: false, reason: 'Earn Base is true' };
  }
  if (listing.isPublished) {
    return { isVerifying: false, reason: 'Already published' };
  }
  if (listing.publishedAt) {
    logger.debug('Unpublished Listing does not need verification', {
      listingId: listing.id,
      listingPublishedAt: listing.publishedAt,
    });
    return {
      isVerifying: false,
      reason: 'Unpublished Listing does not need verification',
    };
  }

  const isHackathonListing = shouldVerifyHackathonListing(
    validatedListing.type,
  );
  if (isHackathonListing) {
    logger.debug('Hackathon listing requires verification', {
      listingType: validatedListing.type,
      listingId: listing.id,
      userId: user?.id,
      sponsorId: sponsor.id,
    });

    return {
      isVerifying: true,
      reason: 'Hackathon Listing',
    };
  }

  if (shouldSkipVerification(sponsor, user)) {
    logger.debug('Sponsor verified or GOD user', {
      sponsorId: sponsor.id,
      userId: user.id,
      userRole: user.role,
    });
    return { isVerifying: false, reason: 'Sponsor verified or GOD user' };
  }

  logger.info(
    `Processing unverified sponsor checks for sponsor ${sponsor.id}`,
    { id: listing.id },
  );

  const cautionResult = checkCautionStatus(sponsor);
  if (cautionResult.isVerifying) {
    return cautionResult;
  }

  const newSponsorResult = await checkNewSponsorStatus(sponsor.id);
  if (newSponsorResult.isVerifying) {
    return newSponsorResult;
  }

  const overdueResult = await checkOverdueListings(sponsor.id);
  if (overdueResult.isVerifying) {
    return overdueResult;
  }

  return { isVerifying: false, reason: 'All checks passed' };
};
