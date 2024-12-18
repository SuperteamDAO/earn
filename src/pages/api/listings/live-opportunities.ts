import { type NextApiRequest, type NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { setCacheHeaders } from '@/utils/cacheControl';
import { safeStringify } from '@/utils/safeStringify';

export default async function liveOpportunities(
  _: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const result = await prisma.bounties.aggregate({
      where: {
        status: 'OPEN',
        isPublished: true,
        isArchived: false,
        isPrivate: false,
        isActive: true,
        isWinnersAnnounced: false,
        deadline: {
          gt: new Date(),
        },
      },
      _sum: {
        usdValue: true,
      },
    });

    setCacheHeaders(res, {
      public: true,
      // 1 day
      maxAge: 24 * 60 * 60,
      sMaxAge: 24 * 60 * 60,
      staleWhileRevalidate: 60 * 60, // 1 hour
    });

    return res.status(200).json({
      totalUsdValue: Math.round(result._sum.usdValue || 0),
    });
  } catch (error) {
    logger.error(`Error fetching live opportunities: ${safeStringify(error)}`);
    return res
      .status(500)
      .json({ error: 'Failed to fetch live opportunities' });
  }
}
