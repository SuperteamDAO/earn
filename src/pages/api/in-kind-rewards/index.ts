import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { getInKindRewardList } from '@/server/inKindRewards';
import { setCacheHeaders } from '@/utils/cacheControl';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithUser } from '@/features/auth/types';
import { withAuth } from '@/features/auth/utils/withAuth';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  setCacheHeaders(res, { noStore: true });

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true },
    });

    if (user?.role !== 'GOD') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const rewards = await getInKindRewardList();
    return res.status(200).json({ rewards });
  } catch (error) {
    logger.error(`Failed to load in-kind rewards: ${safeStringify(error)}`);
    return res.status(500).json({ error: 'Failed to load in-kind rewards' });
  }
}

export default withAuth(handler);
