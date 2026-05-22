import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { getChapterRegions } from '@/utils/chapterRegion';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithUser } from '@/features/auth/types';
import { withAuth } from '@/features/auth/utils/withAuth';
import {
  getEffectiveRegionVerificationStatus,
  REGION_VERIFICATION_STATUS,
} from '@/features/listings/utils/regionVerification';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const { listingId } = req.query;
  const userId = req.userId;

  if (!listingId || typeof listingId !== 'string') {
    return res.status(400).json({ error: 'Invalid or missing listingId' });
  }

  logger.debug(`Request query: ${safeStringify(req.query)}`);

  try {
    logger.debug(
      `Checking submission existence for listing ID: ${listingId} and user ID: ${userId}`,
    );
    const submission = await prisma.submission.findFirst({
      where: {
        listingId,
        userId,
        isActive: true,
        isArchived: false,
      },
      select: {
        id: true,
        status: true,
        isWinner: true,
        isPaid: true,
        winnerPosition: true,
        paymentSynced: true,
        regionVerificationStatus: true,
        regionVerificationCountry: true,
        regionVerificationVerifiedAt: true,
        listing: {
          select: {
            isWinnersAnnounced: true,
            region: true,
          },
        },
        user: {
          select: {
            isKYCVerified: true,
            kycVerifiedAt: true,
            kycCountry: true,
          },
        },
      },
    });

    const responseData: {
      isSubmitted: boolean;
      status: string | null;
      isWinner?: boolean;
      isKYCVerified?: boolean;
      kycVerifiedAt?: Date;
      isPaid?: boolean;
      winnerPosition?: number;
      id?: string;
      paymentSynced?: boolean;
      kycCountry?: string | null;
      listingRegion?: string | null;
      regionVerificationStatus?: string;
      regionVerificationCountry?: string | null;
      regionVerificationVerifiedAt?: Date;
    } = {
      isSubmitted: !!submission,
      status: submission ? submission.status : null,
      id: submission?.id,
    };

    if (submission?.listing.isWinnersAnnounced) {
      const chapters = await getChapterRegions();
      const effectiveRegionVerificationStatus =
        getEffectiveRegionVerificationStatus({
          region: submission.listing.region,
          kycCountry: submission.user.kycCountry,
          regionVerificationStatus: submission.regionVerificationStatus,
          chapters,
        });

      responseData.isWinner = submission.isWinner;
      responseData.isKYCVerified = submission.user.isKYCVerified;
      responseData.isPaid = submission.isPaid;
      responseData.winnerPosition = submission.winnerPosition ?? undefined;
      responseData.paymentSynced = submission.paymentSynced;
      responseData.kycVerifiedAt = submission.user.kycVerifiedAt ?? undefined;
      responseData.kycCountry = submission.user.kycCountry ?? undefined;
      responseData.listingRegion = submission.listing.region ?? undefined;
      responseData.regionVerificationStatus =
        effectiveRegionVerificationStatus;
      responseData.regionVerificationCountry =
        submission.regionVerificationCountry ?? submission.user.kycCountry;
      responseData.regionVerificationVerifiedAt =
        submission.regionVerificationVerifiedAt ??
        (effectiveRegionVerificationStatus ===
        REGION_VERIFICATION_STATUS.KycCountryMatched
          ? submission.user.kycVerifiedAt ?? undefined
          : undefined);
    }

    logger.info(
      `Checked submission existence for listing ID: ${listingId} and user ID: ${userId}`,
    );
    res.status(200).json(responseData);
  } catch (error: any) {
    logger.error(
      `Error occurred while checking submission existence for listing ID=${listingId} and user ID=${userId}: ${safeStringify(error)}`,
    );
    res.status(400).json({
      error: error.message,
      message: `Error occurred while checking submission existence for listing=${listingId} and user=${userId}.`,
    });
  }
}

export default withAuth(handler);
