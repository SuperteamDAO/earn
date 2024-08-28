import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const userCount = await prisma.user.count();

    let errorCount = 0;

    if (process.env.NODE_ENV === 'production') {
      errorCount = 289;
    }

    const roundedUserCount = Math.ceil((userCount - errorCount) / 10) * 10;

    logger.info('Successfully fetched user count', {
      totalUsers: roundedUserCount,
    });

    return res.status(200).json({
      totalUsers: roundedUserCount,
    });
  } catch (error: any) {
    logger.error('Error occurred while fetching user count', {
      error: error.message,
    });

    return res.status(500).json({
      error: 'An error occurred while fetching the total user count',
    });
  }
}
