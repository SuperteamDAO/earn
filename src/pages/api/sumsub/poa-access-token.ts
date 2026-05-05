import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser } from '@/features/auth/types';
import { withAuth } from '@/features/auth/utils/withAuth';
import { createSumsubAccessToken } from '@/features/kyc/utils/createSumsubAccessToken';

const handler = async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const userId = req.userId;

  try {
    const secretKey = process.env.SUMSUB_SECRET_KEY;
    const appToken = process.env.SUMSUB_API_KEY;
    const levelName = process.env.SUMSUB_POA_LEVEL_NAME;

    if (!secretKey || !appToken || !userId || !levelName) {
      return res.status(500).json({ message: 'Missing environment variables' });
    }

    const result = await createSumsubAccessToken(
      userId,
      levelName,
      secretKey,
      appToken,
    );

    return res.status(200).json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return res.status(400).json({ message });
  }
};

export default withAuth(handler);
