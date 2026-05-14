import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { LockNotAcquiredError, withRedisLock } from '@/lib/with-redis-lock';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithUser } from '@/features/auth/types';
import { withAuth } from '@/features/auth/utils/withAuth';
import { createTranche } from '@/features/grants/utils/createTranche';
import { COINDCX_GRANT_ID } from '@/features/grants/utils/stGrant';
import { checkVerificationStatus } from '@/features/kyc/utils/checkVerificationStatus';
import { getApplicantData } from '@/features/kyc/utils/getApplicantData';
import { isMainDocCountryRejection } from '@/features/kyc/utils/isMainDocCountryRejection';
import {
  getKycRegionVerificationStatus,
  REGION_VERIFICATION_STATUS,
} from '@/features/listings/utils/regionVerification';
import { getChapterRegions } from '@/utils/chapterRegion';

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

    const isAllowed =
      grantApplication.grant.id !== COINDCX_GRANT_ID &&
      !!grantApplication.grant.airtableId &&
      grantApplication.grant.isNative &&
      grantApplication.applicationStatus === 'Approved';

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
      const {
        fullName,
        country,
        dob,
        idNumber,
        idType,
      } = grantApplication.user.isKYCVerified
        ? {
            fullName: grantApplication.user.kycName,
            country: grantApplication.user.kycCountry,
            dob: grantApplication.user.kycDOB,
            idNumber: grantApplication.user.kycIDNumber,
            idType: grantApplication.user.kycIDType,
          }
        : applicantData;
      const chapters = await getChapterRegions();
      const regionVerificationStatus = getKycRegionVerificationStatus({
        region: grantApplication.grant.region,
        kycCountry: country,
        chapters,
      });
      const poaRequired =
        regionVerificationStatus === REGION_VERIFICATION_STATUS.PoaRequired;

      try {
        await withRedisLock(
          `locks:create-tranche:${grantApplicationId}:first-tranche`,
          async () => {
            if (!grantApplication.user.isKYCVerified) {
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
            }

            await prisma.grantApplication.update({
              where: { id: grantApplicationId },
              data: {
                regionVerificationStatus,
                regionVerificationCountry: country,
                regionVerificationVerifiedAt: poaRequired ? null : new Date(),
              },
            });

            if (!poaRequired) {
              await createTranche({
                applicationId: grantApplicationId,
                isFirstTranche: true,
              });
            }
          },
          { ttlSeconds: 300 },
        );
      } catch (lockError) {
        if (lockError instanceof LockNotAcquiredError) {
          return res.status(409).json({
            message:
              'First tranche creation already in progress for this application',
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
      await prisma.grantApplication.update({
        where: { id: grantApplicationId },
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
      `Grant application KYC verification failed: ${safeStringify(error)}, grantApplicationId: ${grantApplicationId}`,
    );

    if (typeof message === 'string' && message.includes('Sumsub')) {
      return res.status(422).json({ message });
    }

    return res.status(400).json({ message });
  }
};

export default withAuth(handler);
