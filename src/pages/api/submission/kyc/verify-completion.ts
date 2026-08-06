import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { LockNotAcquiredError, withRedisLock } from '@/lib/with-redis-lock';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithUser } from '@/features/auth/types';
import { withAuth } from '@/features/auth/utils/withAuth';
import { checkVerificationStatus } from '@/features/kyc/utils/checkVerificationStatus';
import { getApplicantData } from '@/features/kyc/utils/getApplicantData';
import { isMainDocCountryRejection } from '@/features/kyc/utils/isMainDocCountryRejection';
import { createPayment } from '@/features/listings/utils/createPayment';
import {
  getKycRegionVerificationStatus,
  KYC_REGION_VERIFICATION_CUTOFF,
  REGION_VERIFICATION_STATUS,
} from '@/features/listings/utils/regionVerification';
import { getChapterRegions } from '@/utils/chapterRegion';

const handler = async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const userId = req.userId;
  const submissionId = req.query.submissionId as string;
  if (!userId) {
    logger.warn(`Missing user ID for submission verification`);
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
      submission.listing.winnersAnnouncedAt &&
      submission.listing.winnersAnnouncedAt > KYC_REGION_VERIFICATION_CUTOFF;

    if (!isAllowed) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    const secretKey = process.env.SUMSUB_SECRET_KEY;
    const appToken = process.env.SUMSUB_API_KEY;

    if (!secretKey || !appToken) {
      return res.status(500).json({ message: 'Missing environment variables' });
    }

    const applicantData = await getApplicantData(userId, secretKey, appToken);
    const result = await checkVerificationStatus(
      applicantData.id,
      secretKey,
      appToken,
    );

    if (result === 'verified') {
      const { fullName, country, dob, idNumber, idType } = applicantData;
      const chapters = await getChapterRegions();
      const regionVerificationStatus = getKycRegionVerificationStatus({
        region: submission.listing.region,
        kycCountry: country,
        chapters,
      });
      const poaRequired =
        regionVerificationStatus === REGION_VERIFICATION_STATUS.PoaRequired;

      try {
        await withRedisLock(
          `locks:create-payment:${userId}`,
          async () => {
            await prisma.user.update({
              where: { id: userId },
              data: {
                isKYCVerified: true,
                kycName: fullName,
                kycCountry: country,
                kycDOB: dob,
                kycIDNumber: idNumber,
                kycIDType: idType,
                kycVerifiedAt: new Date(),
              },
            });

            await prisma.submission.update({
              where: { id: submissionId },
              data: {
                regionVerificationStatus,
                regionVerificationCountry: country,
                regionVerificationVerifiedAt: poaRequired ? null : new Date(),
              },
            });

            if (!poaRequired) {
              await createPayment({ userId, submissionIds: [submissionId] });
            }
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

      if (poaRequired) {
        return res.status(200).json({ status: 'poa_required' });
      }
    }

    if (
      result !== null &&
      result !== 'verified' &&
      result !== 'timedOut' &&
      typeof result === 'object' &&
      result.status === 'failed' &&
      isMainDocCountryRejection(result)
    ) {
      const { fullName, country, dob, idNumber, idType } = applicantData;
      await prisma.user.update({
        where: { id: userId },
        data: {
          isKYCVerified: true,
          kycName: fullName,
          kycCountry: country,
          kycDOB: dob,
          kycIDNumber: idNumber,
          kycIDType: idType,
          kycVerifiedAt: new Date(),
        },
      });
      await prisma.submission.update({
        where: { id: submissionId },
        data: {
          regionVerificationStatus: REGION_VERIFICATION_STATUS.PoaRequired,
          regionVerificationCountry: country,
          regionVerificationVerifiedAt: null,
        },
      });

      return res.status(200).json({ status: 'poa_required' });
    }

    return res.status(200).json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Internal server error';

    logger.error(
      `Submission KYC verification failed: ${safeStringify(error)}, submissionId: ${submissionId}`,
    );

    if (typeof message === 'string' && message.includes('Sumsub')) {
      return res.status(422).json({ message });
    }

    return res.status(400).json({ message });
  }
};

export default withAuth(handler);
