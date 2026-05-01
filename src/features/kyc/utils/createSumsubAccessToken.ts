import axios from 'axios';

import { SUMSUB_BASE_URL } from '@/features/kyc/constants/SUMSUB_BASE_URL';
import { type SumSubBaseResponse } from '@/features/kyc/types/SumSubBaseResponse';
import { createSumSubHeaders } from '@/features/kyc/utils/createSumSubHeaders';
import { handleSumSubError } from '@/features/kyc/utils/handleSumSubError';

export async function createSumsubAccessToken(
  userId: string,
  levelName: string,
  secretKey: string,
  appToken: string,
): Promise<SumSubBaseResponse> {
  const url = '/resources/accessTokens/sdk';
  const method = 'POST';
  const body = JSON.stringify({ ttlInSecs: 600, userId, levelName });
  const headers = createSumSubHeaders(method, url, body, secretKey, appToken);

  try {
    const response = await axios.post<SumSubBaseResponse>(
      `${SUMSUB_BASE_URL}${url}`,
      { ttlInSecs: 600, userId, levelName },
      { headers },
    );
    return response.data;
  } catch (error) {
    handleSumSubError(error);
    throw error;
  }
}
