import axios from 'axios';
import type { NextApiResponse } from 'next';

import { prisma } from '@/prisma';

import { type NextApiRequestWithUser } from '@/features/auth/types';
import { withAuth } from '@/features/auth/utils/withAuth';
import { createTranche } from '@/features/grants/utils/createTranche';
import {
  createSumSubHeaders,
  handleSumSubError,
  SUMSUB_BASE_URL,
} from '@/features/kyc/utils';

const checkVerificationStatus = async (
  applicantId: string,
  secretKey: string,
  appToken: string,
): Promise<string | null | undefined> => {
  const url = `/resources/applicants/${applicantId}/status`;
  const method = 'GET';
  const body = '';

  const headers = createSumSubHeaders(method, url, body, secretKey, appToken);

  try {
    const response = await axios.get(`${SUMSUB_BASE_URL}${url}`, { headers });
    const reviewStatus = response.data.reviewResult.reviewAnswer;
    console.log(response.data);
    if (reviewStatus === 'GREEN') {
      return 'verified';
    }
    if (reviewStatus === 'RED') {
      return 'failed';
    }
    if (reviewStatus === 'pending') {
      return 'pending';
    }
    if (reviewStatus === 'init') {
      return 'init';
    }
    return null;
  } catch (error) {
    handleSumSubError(error);
    return null;
  }
};

const getApplicantData = async (
  userId: string,
  secretKey: string,
  appToken: string,
): Promise<{ id: string; fullName: string }> => {
  const url = `/resources/applicants/-;externalUserId=${userId}/one`;
  const method = 'GET';
  const body = '';

  const headers = createSumSubHeaders(method, url, body, secretKey, appToken);

  try {
    const response = await axios.get(`${SUMSUB_BASE_URL}${url}`, { headers });

    const id = response.data.id;

    const info = response.data.info;
    const firstName = info.firstNameEn || '';
    const middleName = info.middleNameEn || '';
    const lastName = info.lastNameEn || '';

    const fullName = `${firstName} ${middleName} ${lastName}`
      .trim()
      .replace(/\s+/g, ' ');

    return { id, fullName };
  } catch (error) {
    handleSumSubError(error);
    throw error;
  }
};

const handler = async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const userId = req.userId;
  const grantApplicationId = req.query.grantApplicationId as string;
  if (!userId) {
    return res.status(400).json({ message: 'Missing user ID' });
  }

  try {
    const secretKey = process.env.SUMSUB_SECRET_KEY;
    const appToken = process.env.SUMSUB_API_KEY;

    if (!secretKey || !appToken) {
      return res.status(500).json({ message: 'Missing environment variables' });
    }

    const { id: applicantId } = await getApplicantData(
      userId,
      secretKey,
      appToken,
    );
    const result = await checkVerificationStatus(
      applicantId,
      secretKey,
      appToken,
    );

    if (result === 'verified') {
      const { fullName } = await getApplicantData(userId, secretKey, appToken);
      await prisma.grantApplication.update({
        where: { id: grantApplicationId, userId },
        data: { kycStatus: 'Approved', kycName: fullName },
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
    return res.status(400).json({ message });
  }
};

export default withAuth(handler);
