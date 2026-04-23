import axios from 'axios';

import logger from '@/lib/logger';
import { safeStringify } from '@/utils/safeStringify';

import { SUMSUB_BASE_URL } from '../constants/SUMSUB_BASE_URL';
import { createSumSubHeaders } from './createSumSubHeaders';
import { handleSumSubError } from './handleSumSubError';

export const getPoAApplicantId = async (
  userId: string,
  secretKey: string,
  appToken: string,
): Promise<string> => {
  const levelName = process.env.SUMSUB_POA_LEVEL_NAME;
  if (!levelName) {
    throw new Error('Sumsub: SUMSUB_POA_LEVEL_NAME environment variable not set');
  }

  const url = `/resources/applicants/-;externalUserId=${userId};levelName=${levelName}/one`;
  const method = 'GET';
  const body = '';
  const headers = createSumSubHeaders(method, url, body, secretKey, appToken);

  try {
    const response = await axios.get(`${SUMSUB_BASE_URL}${url}`, { headers });
    const id = response.data?.id;
    if (!id) {
      throw new Error('Sumsub: PoA applicant ID not found in response');
    }
    return id as string;
  } catch (error) {
    logger.error(
      `Failed to get PoA applicant ID for userId ${userId}: ${safeStringify(error)}`,
    );
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Sumsub: ${error.message || 'Failed to retrieve PoA applicant'}`,
      );
    }
    handleSumSubError(error);
    throw new Error('Sumsub: Failed to retrieve PoA applicant');
  }
};
