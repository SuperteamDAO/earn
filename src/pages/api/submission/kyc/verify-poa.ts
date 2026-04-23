import type { NextApiResponse } from 'next';

import lookup from 'country-code-lookup';

import logger from '@/lib/logger';
import { LockNotAcquiredError, withRedisLock } from '@/lib/with-redis-lock';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';
import { getChapterRegions } from '@/utils/chapterRegion';

import { type NextApiRequestWithUser } from '@/features/auth/types';
import { withAuth } from '@/features/auth/utils/withAuth';
import { checkVerificationStatus } from '@/features/kyc/utils/checkVerificationStatus';
import { getPoAApplicantId } from '@/features/kyc/utils/getPoAApplicantId';
import { getPoACountry } from '@/features/kyc/utils/getPoACountry';
import { createPayment } from '@/features/listings/utils/createPayment';
import { userRegionEligibilty } from '@/features/listings/utils/region';

const handler = async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const userId = req.userId;
  const submissionId = req.query.submissionId as string;
  if (!userId) {
    logger.warn(`Missing user ID for submission PoA verification`);
    return res.status(400).json({ message: 'Missing user ID' });
  }

  try {
    const submission = await prisma.submission.findUniqueOrThrow({
      where: { id: submissionId, userId },
      include: { user: true, listing: true },
    });

    const isAllowed =
      submission.isWinner &&
      submission.listing.isWinnersAnnounced &&
      submission.listing.isFndnPaying &&
      !submission.isPaid &&
      submission.user.isKYCVerified &&
      submission.listing.winnersAnnouncedAt &&
      new Date(submission.listing.winnersAnnouncedAt) > new Date('2025-08-06');

    if (!isAllowed) {
      return res.status(200).json({ message: 'Not allowed' });
    }

    const secretKey = process.env.SUMSUB_SECRET_KEY;
    const appToken = process.env.SUMSUB_API_KEY;

    if (!secretKey || !appToken) {
      return res.status(500).json({ message: 'Missing environment variables' });
    }

    const applicantId = await getPoAApplicantId(userId, secretKey, appToken);

    const poaStatus = await checkVerificationStatus(applicantId, secretKey, appToken);
    if (poaStatus !== 'verified') {
      return res.status(200).json({ status: 'poa_pending' });
    }

    const rawPoaCountry = await getPoACountry(applicantId, secretKey, appToken);

    if (!rawPoaCountry) {
      return res.status(200).json({ status: 'poa_pending' });
    }

    const poaCountryInfo = lookup.byIso(rawPoaCountry);
    const poaCountryName = poaCountryInfo?.country ?? rawPoaCountry;

    const chapters = await getChapterRegions();
    const isRegionMatch = userRegionEligibilty({
      region: submission.listing.region,
      userLocation: poaCountryName,
      chapters,
    });

    if (!isRegionMatch) {
      return res.status(200).json({ status: 'ineligible' });
    }

    try {
      await withRedisLock(
        `locks:create-payment:${userId}`,
        async () => {
          await createPayment({ userId });
        },
        { ttlSeconds: 300 },
      );
    } catch (lockError) {
      if (lockError instanceof LockNotAcquiredError) {
        return res.status(409).json({
          message: 'Payment processing already in progress for this user',
        });
      }
      throw lockError;
    }

    return res.status(200).json({ status: 'verified' });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Internal server error';

    logger.error(
      `Submission PoA verification failed: ${safeStringify(error)}, submissionId: ${submissionId}`,
    );

    if (typeof message === 'string' && message.includes('Sumsub')) {
      return res.status(422).json({ message });
    }

    return res.status(400).json({ message });
  }
};

export default withAuth(handler);
