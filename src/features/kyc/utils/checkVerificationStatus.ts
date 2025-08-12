import axios from 'axios';
import { setTimeout } from 'timers/promises';

import logger from '@/lib/logger';
import { safeStringify } from '@/utils/safeStringify';

import { SUMSUB_BASE_URL } from '../constants/SUMSUB_BASE_URL';
import { createSumSubHeaders } from './createSumSubHeaders';
import { handleSumSubError } from './handleSumSubError';

export const checkVerificationStatus = async (
  applicantId: string,
  secretKey: string,
  appToken: string,
  maxAttempts = 10,
  delay = 1000,
): Promise<string | null> => {
  const url = `/resources/applicants/${applicantId}/status`;
  const method = 'GET';
  const body = '';

  const headers = createSumSubHeaders(method, url, body, secretKey, appToken);

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await axios.get(`${SUMSUB_BASE_URL}${url}`, { headers });
      const reviewStatus = response.data?.reviewResult?.reviewAnswer;

      if (reviewStatus === 'GREEN') {
        return 'verified';
      }
      if (reviewStatus === 'RED') {
        return 'failed';
      }
    } catch (error) {
      logger.error(
        `Sumsub verification status check failed for applicantId ${applicantId} on attempt ${i + 1}: ${safeStringify(error)}`,
      );

      if (axios.isAxiosError(error)) {
      } else {
        handleSumSubError(error);
        throw new Error('Sumsub: Failed to check verification status');
      }
    }

    await setTimeout(delay);
  }

  logger.warn(
    `Sumsub verification polling timed out for applicantId ${applicantId} after ${maxAttempts} attempts.`,
  );

  return 'timedOut';
};
