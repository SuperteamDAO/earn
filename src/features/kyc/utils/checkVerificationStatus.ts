import axios from 'axios';

import logger from '@/lib/logger';
import { safeStringify } from '@/utils/safeStringify';

import { SUMSUB_BASE_URL } from '../constants/SUMSUB_BASE_URL';
import { createSumSubHeaders } from './createSumSubHeaders';
import { handleSumSubError } from './handleSumSubError';

export const checkVerificationStatus = async (
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
