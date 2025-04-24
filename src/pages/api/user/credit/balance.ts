import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser } from '@/features/auth/types';
import { withAuth } from '@/features/auth/utils/withAuth';
import { creditAggregate } from '@/features/credits/utils/creditAggregate';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = req.userId;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  try {
    const balance = await creditAggregate(userId);
    return res.status(200).json({ balance });
  } catch (error: any) {
    return res.status(500).json({
      error: error.message || 'Internal Server Error',
    });
  }
}

export default withAuth(handler);
