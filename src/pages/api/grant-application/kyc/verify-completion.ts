import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithUser } from '@/features/auth/types';
import { withAuth } from '@/features/auth/utils/withAuth';
import { createTranche } from '@/features/grants/utils/createTranche';
import { checkVerificationStatus } from '@/features/kyc/utils/checkVerificationStatus';
import { getApplicantData } from '@/features/kyc/utils/getApplicantData';

const handler = async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const userId = req.userId;
  const grantApplicationId = req.query.grantApplicationId as string;
  if (!userId) {
    logger.warn(`Missing user ID for grant application verification`);
    return res.status(400).json({ message: 'Missing user ID' });
  }

  try {
    const grantApplication = await prisma.grantApplication.findUniqueOrThrow({
      where: { id: grantApplicationId },
      include: { user: true, grant: true },
    });

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
      if (grantApplication.user.isKYCVerified) {
        return res.status(200).json({ message: 'KYC already verified' });
      }

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

      await createTranche({
        applicationId: grantApplicationId,
        isFirstTranche: true,
      });
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
