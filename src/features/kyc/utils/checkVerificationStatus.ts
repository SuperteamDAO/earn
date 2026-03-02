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
): Promise<
  | 'verified'
  | 'timedOut'
  | {
      status: 'failed';
      reason: string;
      rejectType?: string;
      rejectLabels?: string[];
    }
  | null
> => {
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
        const reviewResult = response.data?.reviewResult;
        const rejectType =
          typeof reviewResult?.reviewRejectType === 'string'
            ? reviewResult.reviewRejectType
            : undefined;
        const rejectLabels = Array.isArray(reviewResult?.rejectLabels)
          ? reviewResult.rejectLabels.filter(
              (label: unknown): label is string => typeof label === 'string',
            )
          : undefined;
        const moderationComment =
          typeof reviewResult?.moderationComment === 'string'
            ? reviewResult.moderationComment.trim()
            : '';
        const clientComment =
          typeof reviewResult?.clientComment === 'string'
            ? reviewResult.clientComment.trim()
            : '';

        const reason =
          clientComment ||
          moderationComment ||
          (rejectLabels?.length
            ? `Rejected due to: ${rejectLabels.join(', ')}`
            : rejectType
              ? `Rejected (${rejectType})`
              : 'Your verification was rejected. Please review your details and try again.');

        return {
          status: 'failed',
          reason,
          rejectType,
          rejectLabels,
        };
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
