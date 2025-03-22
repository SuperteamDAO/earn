import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { setCacheHeaders } from '@/utils/cacheControl';
import { safeStringify } from '@/utils/safeStringify';

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const sponsorCount = await prisma.sponsors.count();

    let errorCount = 0;

    if (process.env.NODE_ENV === 'production') {
      errorCount = 0;
    }

    const roundedSponsorCount =
      Math.ceil((sponsorCount - errorCount) / 10) * 10;

    setCacheHeaders(res, {
      public: true,
      // Cache for 1 day
      maxAge: 24 * 60 * 60,
      sMaxAge: 24 * 60 * 60,
      staleWhileRevalidate: 60 * 60, // 1 hour
    });

    logger.info('Successfully fetched sponsor count', {
      totalSponsors: roundedSponsorCount,
    });

    return res.status(200).json({
      totalSponsors: roundedSponsorCount,
    });
  } catch (error: any) {
    logger.error('Error occurred while fetching sponsor count', {
      error: safeStringify(error),
    });

    return res.status(500).json({
      error: 'An error occurred while fetching the total sponsor count',
    });
  }
}
