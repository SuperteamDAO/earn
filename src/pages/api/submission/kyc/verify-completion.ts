import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { LockNotAcquiredError, withRedisLock } from '@/lib/with-redis-lock';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithUser } from '@/features/auth/types';
import { withAuth } from '@/features/auth/utils/withAuth';
import { checkVerificationStatus } from '@/features/kyc/utils/checkVerificationStatus';
import { getApplicantData } from '@/features/kyc/utils/getApplicantData';
import { createPayment } from '@/features/listings/utils/createPayment';
import { checkKycCountryMatchesRegion } from '@/features/listings/utils/region';

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
      new Date(submission.listing.winnersAnnouncedAt) > new Date('2025-08-06');

    if (!isAllowed) {
      return res.status(200).json({ message: 'Not allowed' });
    }

    const secretKey = process.env.SUMSUB_SECRET_KEY;
    const appToken = process.env.SUMSUB_API_KEY;

    if (!secretKey || !appToken) {
      return res.status(500).json({ message: 'Missing environment variables' });
    }

    const applicantData = await getApplicantData(userId, secretKey, appToken);
    const { id: applicantId } = applicantData;
    const result = await checkVerificationStatus(
      applicantId,
      secretKey,
      appToken,
    );

    if (result === 'verified') {
      try {
        await withRedisLock(
          `locks:create-payment:${userId}`,
          async () => {
            const wasAlreadyVerified = submission.user.isKYCVerified ?? false;
            const {
              fullName,
              country,
              dob,
              idNumber,
              idType,
              documentExpiresAt,
            } = applicantData;

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
                kycExpiresAt: documentExpiresAt,
              },
            });

            const kycCountryCheck = checkKycCountryMatchesRegion(
              country,
              submission.listing.region,
            );

            if (!kycCountryCheck.isValid) {
              logger.warn(
                `KYC country mismatch for submission ${submissionId}: KYC country ${country} does not match listing region ${submission.listing.region}`,
              );
              return res.status(400).json({
                message: 'KYC_REJECTED',
                error: `Your KYC document doesn't belong to ${kycCountryCheck.regionDisplayName}. Please verify again with a KYC document that belongs to ${kycCountryCheck.regionDisplayName}.`,
                regionDisplayName: kycCountryCheck.regionDisplayName,
              });
            }

            if (!wasAlreadyVerified) {
              await createPayment({ userId });
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
