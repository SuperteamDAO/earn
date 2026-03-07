import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { LockNotAcquiredError, withRedisLock } from '@/lib/with-redis-lock';
import { prisma } from '@/prisma';
import { getChapterRegions } from '@/utils/chapterRegion';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithUser } from '@/features/auth/types';
import { withAuth } from '@/features/auth/utils/withAuth';
import { createTranche } from '@/features/grants/utils/createTranche';
import { checkVerificationStatus } from '@/features/kyc/utils/checkVerificationStatus';
import { getApplicantData } from '@/features/kyc/utils/getApplicantData';
import { checkKycCountryMatchesRegion } from '@/features/listings/utils/region';

const handler = async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const userId = req.userId;
  const grantApplicationId = req.query.grantApplicationId as string;
  if (!userId) {
    logger.warn(`Missing user ID for grant application verification`);
    return res.status(400).json({ message: 'Missing user ID' });
  }

  try {
    const grantApplication = await prisma.grantApplication.findFirstOrThrow({
      where: { id: grantApplicationId, userId },
      include: { user: true, grant: true },
    });
    const chapterRegions = await getChapterRegions();

    const isAllowed =
      grantApplication.grant.id !== 'c72940f7-81ae-4c03-9bfe-9979d4371267' &&
      !!grantApplication.grant.airtableId &&
      grantApplication.grant.isNative &&
      grantApplication.applicationStatus === 'Approved';

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
        const verificationOutcome = await withRedisLock(
          `locks:create-tranche:${grantApplicationId}:first-tranche`,
          async () => {
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

            const kycCountryCheck = checkKycCountryMatchesRegion(
              country,
              grantApplication.grant.region,
              chapterRegions,
            );

            if (!kycCountryCheck.isValid) {
              logger.warn(
                `KYC country mismatch for grant application ${grantApplicationId}: KYC country ${country} does not match grant region ${grantApplication.grant.region}`,
              );
              return {
                message: 'KYC_REJECTED',
                error: `Your KYC document doesn't belong to ${kycCountryCheck.regionDisplayName}. Please verify again with a KYC document that belongs to ${kycCountryCheck.regionDisplayName}.`,
                regionDisplayName: kycCountryCheck.regionDisplayName,
              } as const;
            }

            const existingTranche = await prisma.grantTranche.findFirst({
              where: {
                applicationId: grantApplicationId,
                status: { not: 'Rejected' },
              },
              select: { id: true },
            });

            if (!existingTranche) {
              await createTranche({
                applicationId: grantApplicationId,
                isFirstTranche: true,
              });
            }

            return { message: 'verified' } as const;
          },
          { ttlSeconds: 300 },
        );

        if (verificationOutcome.message === 'KYC_REJECTED') {
          return res.status(400).json(verificationOutcome);
        }
      } catch (lockError) {
        if (lockError instanceof LockNotAcquiredError) {
          return res.status(409).json({
            message:
              'First tranche creation already in progress for this application',
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
      `Grant application KYC verification failed: ${safeStringify(error)}, grantApplicationId: ${grantApplicationId}`,
    );

    if (typeof message === 'string' && message.includes('Sumsub')) {
      return res.status(422).json({ message });
    }

    return res.status(400).json({ message });
  }
};

export default withAuth(handler);
