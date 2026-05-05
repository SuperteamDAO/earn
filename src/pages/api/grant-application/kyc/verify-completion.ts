import type { NextApiResponse } from 'next';

import lookup from 'country-code-lookup';

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
import { approveApplicant } from '@/features/kyc/utils/approveApplicant';
import { isMainDocCountryRejection } from '@/features/kyc/utils/isMainDocCountryRejection';
import { userRegionEligibilty } from '@/features/listings/utils/region';
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

    const { id: applicantId } = applicantData;
    const result = await checkVerificationStatus(
      applicantId,
      secretKey,
      appToken,
    );

    if (result === 'verified') {
      if (grantApplication.user.isKYCVerified) {
        return res.status(200).json({ message: 'KYC already verified' });
      }

      const { fullName, country, dob, idNumber, idType } = applicantData;

      let poaRequired = false;
      if (grantApplication.grant.region) {
        const region = grantApplication.grant.region;
        const isGbrNiException =
          country.toUpperCase() === 'GBR' &&
          region.trim().toLowerCase() === 'ireland (ni and roi)';

        if (!isGbrNiException) {
          const chapters = await getChapterRegions();
          const countryInfo = lookup.byIso(country);
          const countryName = countryInfo?.country ?? country;
          const isRegionMatch = userRegionEligibilty({
            region,
            userLocation: countryName,
            chapters,
          });
          if (!isRegionMatch) {
            poaRequired = true;
          }
        }
      }

      try {
        await withRedisLock(
          `locks:create-tranche:${grantApplicationId}:first-tranche`,
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
      const chapters = await getChapterRegions();
      const isRegionMatch = userRegionEligibilty({
        region: grantApplication.grant.region,
        userLocation: grantApplication.user.location ?? undefined,
        chapters,
      });

      if (!isRegionMatch) {
        return res.status(200).json({ status: 'region_mismatch' });
      }

      if (isRegionMatch) {
        logger.info(
          `Grant KYC: overriding country regulation for grantApplicationId ${grantApplicationId} — user location matches grant region ${grantApplication.grant.region}`,
        );

        await approveApplicant(
          applicantId,
          secretKey,
          appToken,
          `Region verified: user location matches grant region ${grantApplication.grant.region}`,
        );

        try {
          await withRedisLock(
            `locks:create-tranche:${grantApplicationId}:first-tranche`,
            async () => {
              const { fullName, country, dob, idNumber, idType } =
                applicantData;

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

              await createTranche({
                applicationId: grantApplicationId,
                isFirstTranche: true,
              });
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

        return res.status(200).json('verified');
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
