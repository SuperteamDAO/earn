import type { NextApiResponse } from 'next';

import lookup from 'country-code-lookup';

import logger from '@/lib/logger';
import { LockNotAcquiredError, withRedisLock } from '@/lib/with-redis-lock';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';
import { getChapterRegions } from '@/utils/chapterRegion';

import { type NextApiRequestWithUser } from '@/features/auth/types';
import { withAuth } from '@/features/auth/utils/withAuth';
import { createTranche } from '@/features/grants/utils/createTranche';
import { COINDCX_GRANT_ID } from '@/features/grants/utils/stGrant';
import { checkVerificationStatus } from '@/features/kyc/utils/checkVerificationStatus';
import { getPoAApplicantId } from '@/features/kyc/utils/getPoAApplicantId';
import { getPoACountry } from '@/features/kyc/utils/getPoACountry';
import { userRegionEligibilty } from '@/features/listings/utils/region';

const handler = async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const userId = req.userId;
  const grantApplicationId = req.query.grantApplicationId as string;
  if (!userId) {
    logger.warn(`Missing user ID for grant application PoA verification`);
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
      grantApplication.applicationStatus === 'Approved' &&
      grantApplication.user.isKYCVerified;

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
      region: grantApplication.grant.region,
      userLocation: poaCountryName,
      chapters,
    });

    if (!isRegionMatch) {
      return res.status(200).json({ status: 'ineligible' });
    }

    try {
      await withRedisLock(
        `locks:create-tranche:${grantApplicationId}:first-tranche`,
        async () => {
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

    return res.status(200).json({ status: 'verified' });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Internal server error';

    logger.error(
      `Grant application PoA verification failed: ${safeStringify(error)}, grantApplicationId: ${grantApplicationId}`,
    );

    if (typeof message === 'string' && message.includes('Sumsub')) {
      return res.status(422).json({ message });
    }

    return res.status(400).json({ message });
  }
};

export default withAuth(handler);
