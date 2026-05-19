import axios from 'axios';

import logger from '@/lib/logger';
import { safeStringify } from '@/utils/safeStringify';

import { SUMSUB_BASE_URL } from '../constants/SUMSUB_BASE_URL';
import { createSumSubHeaders } from './createSumSubHeaders';
import { handleSumSubError } from './handleSumSubError';

export const getPoACountry = async (
  applicantId: string,
  secretKey: string,
  appToken: string,
): Promise<string | null> => {
  const url = `/resources/applicants/${applicantId}/one`;
  const method = 'GET';
  const body = '';
  const headers = createSumSubHeaders(method, url, body, secretKey, appToken);

  try {
    const response = await axios.get(`${SUMSUB_BASE_URL}${url}`, { headers });
    const addresses = response.data?.info?.addresses;
    if (Array.isArray(addresses) && addresses.length > 0) {
      return addresses[0]?.country || null;
    }
    return null;
  } catch (error) {
    logger.error(
      `Failed to get PoA country for applicant ${applicantId}: ${safeStringify(error)}`,
    );
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Sumsub: ${error.message || 'Failed to retrieve PoA data'}`,
      );
    }
    handleSumSubError(error);
    throw new Error('Sumsub: Failed to retrieve PoA data');
  }
};
