import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { LockNotAcquiredError, withRedisLock } from '@/lib/with-redis-lock';
import { prisma } from '@/prisma';
import { PrismaClientKnownRequestError } from '@/prisma/internal/prismaNamespace';
import { getChapterRegions } from '@/utils/chapterRegion';
import { safeStringify } from '@/utils/safeStringify';

import type { NextApiRequestWithUser } from '@/features/auth/types';
import { withAuth } from '@/features/auth/utils/withAuth';
import { checkVerificationStatus } from '@/features/kyc/utils/checkVerificationStatus';
import { getPoAApplicantId } from '@/features/kyc/utils/getPoAApplicantId';
import { getPoACountry } from '@/features/kyc/utils/getPoACountry';
import { createPayment } from '@/features/listings/utils/createPayment';
import {
  getEffectiveRegionVerificationStatus,
  isCountryEligibleForRegion,
  KYC_REGION_VERIFICATION_CUTOFF,
  REGION_VERIFICATION_STATUS,
} from '@/features/listings/utils/regionVerification';

const handler = async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const userId = req.userId;
  const { submissionId } = req.query;
  if (!userId) {
    logger.warn(`Missing user ID for submission PoA verification`);
    return res.status(400).json({ message: 'Missing user ID' });
  }

  if (!submissionId || typeof submissionId !== 'string') {
    return res.status(400).json({ message: 'Missing submission ID' });
  }

  try {
    const submission = await prisma.submission.findUniqueOrThrow({
      where: { id: submissionId, userId },
      include: { user: true, listing: true },
    });

    const chapters = await getChapterRegions();
    const effectiveRegionVerificationStatus =
      getEffectiveRegionVerificationStatus({
        region: submission.listing.region,
        kycCountry: submission.user.kycCountry,
        regionVerificationStatus: submission.regionVerificationStatus,
        chapters,
      });

    const isAllowed =
      submission.isWinner &&
      submission.listing.isWinnersAnnounced &&
      submission.listing.isFndnPaying &&
      !submission.isPaid &&
      submission.user.isKYCVerified &&
      effectiveRegionVerificationStatus === REGION_VERIFICATION_STATUS.PoaRequired &&
      submission.listing.winnersAnnouncedAt &&
      submission.listing.winnersAnnouncedAt > KYC_REGION_VERIFICATION_CUTOFF;

    if (!isAllowed) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    if (
      submission.regionVerificationStatus !==
      REGION_VERIFICATION_STATUS.PoaRequired
    ) {
      await prisma.submission.update({
        where: { id: submissionId },
        data: {
          regionVerificationStatus: REGION_VERIFICATION_STATUS.PoaRequired,
          regionVerificationCountry:
            submission.regionVerificationCountry ?? submission.user.kycCountry,
          regionVerificationVerifiedAt: null,
        },
      });
    }

    const secretKey = process.env.SUMSUB_SECRET_KEY;
    const appToken = process.env.SUMSUB_API_KEY;

    if (!secretKey || !appToken) {
      return res.status(500).json({ message: 'Missing environment variables' });
    }

    let applicantId: string;
    try {
      applicantId = await getPoAApplicantId(userId, secretKey, appToken);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Internal server error';
      if (message.includes('PoA applicant not found')) {
        return res.status(200).json({
          status: 'poa_not_started',
          message: 'Please start the proof of address verification flow',
        });
      }
      throw error;
    }

    const poaStatus = await checkVerificationStatus(
      applicantId,
      secretKey,
      appToken,
    );

    if (
      poaStatus === 'timedOut' ||
      poaStatus === null
    ) {
      return res.status(200).json({ status: 'poa_pending' });
    }

    if (poaStatus !== 'verified') {
      return res.status(200).json({
        status: 'poa_rejected',
        message:
          typeof poaStatus === 'object'
            ? poaStatus.reason
            : 'Proof of address was rejected',
      });
    }

    const rawPoaCountry = await getPoACountry(applicantId, secretKey, appToken);

    if (!rawPoaCountry) {
      return res.status(200).json({ status: 'poa_pending' });
    }

    const isRegionMatch = isCountryEligibleForRegion({
      country: rawPoaCountry,
      region: submission.listing.region,
      chapters,
    });

    if (!isRegionMatch) {
      await prisma.submission.update({
        where: { id: submissionId },
        data: {
          regionVerificationStatus: REGION_VERIFICATION_STATUS.Ineligible,
          regionVerificationCountry: rawPoaCountry,
          regionVerificationVerifiedAt: null,
        },
      });
      return res.status(200).json({ status: 'ineligible' });
    }

    try {
      const paymentResult = await withRedisLock(
        `locks:create-payment:${userId}`,
        async () => {
          await prisma.submission.update({
            where: { id: submissionId },
            data: {
              regionVerificationStatus: REGION_VERIFICATION_STATUS.PoaVerified,
              regionVerificationCountry: rawPoaCountry,
              regionVerificationVerifiedAt: new Date(),
            },
          });
          return await createPayment({ userId, submissionIds: [submissionId] });
        },
        { ttlSeconds: 300 },
      );

      const didProcessSubmission = paymentResult.submissions.some(
        (submission) => submission.id === submissionId,
      );

      if (!didProcessSubmission) {
        logger.error(
          `Submission PoA verified but payment creation failed: submissionId=${submissionId}, result=${safeStringify(paymentResult)}`,
        );

        return res.status(200).json({
          status: 'payment_failed',
          message: 'Payment could not be created after PoA verification',
        });
      }
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

    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    if (typeof message === 'string' && message.includes('Sumsub')) {
      return res.status(422).json({ message });
    }

    return res.status(500).json({ message });
  }
};

export default withAuth(handler);
