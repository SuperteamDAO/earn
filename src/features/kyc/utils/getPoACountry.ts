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
      const relevantAddress = addresses
        .filter(
          (
            address,
          ): address is {
            country: string;
            isCurrentAddress?: boolean;
            current?: boolean;
            default?: boolean;
            createdAt?: string;
            updatedAt?: string;
            addedAt?: string;
          } =>
            Boolean(
              address &&
                typeof address === 'object' &&
                typeof address.country === 'string' &&
                address.country.trim(),
            ),
        )
        .sort((a, b) => {
          const currentScoreA =
            a.isCurrentAddress || a.current || a.default ? 1 : 0;
          const currentScoreB =
            b.isCurrentAddress || b.current || b.default ? 1 : 0;

          if (currentScoreA !== currentScoreB) {
            return currentScoreB - currentScoreA;
          }

          const timestampA = Date.parse(
            a.updatedAt ?? a.addedAt ?? a.createdAt ?? '',
          );
          const timestampB = Date.parse(
            b.updatedAt ?? b.addedAt ?? b.createdAt ?? '',
          );

          if (!Number.isNaN(timestampA) && !Number.isNaN(timestampB)) {
            return timestampB - timestampA;
          }

          if (!Number.isNaN(timestampA)) return -1;
          if (!Number.isNaN(timestampB)) return 1;

          return 0;
        })[0];

      return relevantAddress?.country ?? null;
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
