import axios from 'axios';

import logger from '@/lib/logger';
import { safeStringify } from '@/utils/safeStringify';

import { SUMSUB_BASE_URL } from '../constants/SUMSUB_BASE_URL';
import { createSumSubHeaders } from './createSumSubHeaders';
import { handleSumSubError } from './handleSumSubError';

export const approveApplicant = async (
  applicantId: string,
  secretKey: string,
  appToken: string,
  note: string,
): Promise<void> => {
  const url = `/resources/applicants/${applicantId}/-/approve`;
  const method = 'POST';
  const body = JSON.stringify({
    note,
    tags: ['region-override'],
  });

  const headers = createSumSubHeaders(method, url, body, secretKey, appToken);

  try {
    await axios.post(`${SUMSUB_BASE_URL}${url}`, body, { headers });
    logger.info(
      `Successfully approved applicant ${applicantId} in Sumsub: ${note}`,
    );
  } catch (error) {
    logger.error(
      `Failed to approve applicant ${applicantId} in Sumsub: ${safeStringify(error)}`,
    );
    handleSumSubError(error);
    throw error;
  }
};
