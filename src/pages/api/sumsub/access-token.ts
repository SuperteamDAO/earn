import axios from 'axios';
import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser } from '@/features/auth/types';
import { withAuth } from '@/features/auth/utils/withAuth';
import { SUMSUB_BASE_URL } from '@/features/kyc/constants/SUMSUB_BASE_URL';
import { type SumSubBaseResponse } from '@/features/kyc/types/SumSubBaseResponse';
import { createSumSubHeaders } from '@/features/kyc/utils/createSumSubHeaders';
import { handleSumSubError } from '@/features/kyc/utils/handleSumSubError';

const createSumsubToken = async (
  userId: string,
  secretKey: string,
  appToken: string,
) => {
  const url = '/resources/accessTokens/sdk';
  const method = 'POST';
  const body = JSON.stringify({
    ttlInSecs: 600,
    userId,
    levelName: process.env.SUMSUB_LEVEL_NAME,
  });

  const headers = createSumSubHeaders(method, url, body, secretKey, appToken);

  try {
    const response = await axios.post<SumSubBaseResponse>(
      `${SUMSUB_BASE_URL}${url}`,
      { ttlInSecs: 600, userId, levelName: process.env.SUMSUB_LEVEL_NAME },
      { headers },
    );
    return response.data;
  } catch (error) {
    handleSumSubError(error);
    throw error;
  }
};

const handler = async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const userId = req.userId;

  try {
    const secretKey = process.env.SUMSUB_SECRET_KEY;
    const appToken = process.env.SUMSUB_API_KEY;

    if (!secretKey || !appToken || !userId) {
      return res.status(500).json({ message: 'Missing environment variables' });
    }

    const result = await createSumsubToken(userId, secretKey, appToken);

    return res.status(200).json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return res.status(400).json({ message });
  }
};

export default withAuth(handler);
