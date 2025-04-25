import axios from 'axios';
import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

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

    if (!reviewStatus) {
      logger.warn(
        `Sumsub returned no review status for applicantId ${applicantId}: ${safeStringify(response.data)}`,
      );
      throw new Error('Sumsub: Invalid response format');
    }

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
    logger.error(
      `Sumsub verification status check failed for applicantId ${applicantId}: ${safeStringify(error)}`,
    );

    if (axios.isAxiosError(error)) {
      throw new Error(
        `Sumsub: ${error.message || 'Verification status check failed'}`,
      );
    }

    handleSumSubError(error);
    throw new Error('Sumsub: Failed to check verification status');
  }
};

const getApplicantData = async (
  userId: string,
  secretKey: string,
  appToken: string,
): Promise<{
  id: string;
  fullName: string;
  country: string;
  address: string;
  dob: string;
  idNumber: string;
  idType: string;
}> => {
  const url = `/resources/applicants/-;externalUserId=${userId}/one`;
  const method = 'GET';
  const body = '';

  const headers = createSumSubHeaders(method, url, body, secretKey, appToken);

  try {
    const response = await axios.get(`${SUMSUB_BASE_URL}${url}`, { headers });

    const id = response.data.id;
    if (!id) {
      throw new Error('Sumsub: Applicant ID not found in response');
    }

    const info = response.data.info;

    const firstName = info.firstNameEn || '';
    const middleName = info.middleNameEn || '';
    const lastName = info.lastNameEn || '';
    const fullName = `${firstName} ${middleName} ${lastName}`
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    const country = info.country || '';
    const dob = info.dob || '';

    const idDoc = info.idDocs?.[0] || {};

    const formattedAddress = idDoc?.address?.formattedAddress;
    const address = formattedAddress ? formattedAddress : null;
    const idNumber = idDoc.number || '';
    const idType = idDoc.idDocType || '';

    return {
      id,
      fullName,
      country,
      address,
      dob,
      idNumber,
      idType,
    };
  } catch (error) {
    logger.error(
      `Failed to get applicant data from Sumsub for userId ${userId}: ${safeStringify(error)}`,
    );

    if (axios.isAxiosError(error)) {
      throw new Error(
        `Sumsub: ${error.message || 'Failed to retrieve applicant data'}`,
      );
    }

    handleSumSubError(error);
    throw new Error('Sumsub: Failed to retrieve applicant data');
  }
};

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
      if (grantApplication.user.isKYCVerified) {
        return res.status(200).json({ message: 'KYC already verified' });
      }

      const { fullName, country, address, dob, idNumber, idType } =
        await getApplicantData(userId, secretKey, appToken);

      await prisma.user.update({
        where: { id: userId },
        data: {
          isKYCVerified: true,
          kycName: fullName,
          kycCountry: country,
          kycAddress: address,
          kycDOB: dob,
          kycIDNumber: idNumber,
          kycIDType: idType,
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
