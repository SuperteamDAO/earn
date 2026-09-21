import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { setCacheHeaders } from '@/utils/cacheControl';
import { safeStringify } from '@/utils/safeStringify';

import {
  NEXT_STOP_BREAKPOINT_SLUG,
  NEXT_STOP_BREAKPOINT_TAG,
} from '@/features/hackathon/constants/next-stop-breakpoint';

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const liveBountyWhere = {
      type: 'bounty' as const,
      isActive: true,
      isArchived: false,
      isPrivate: false,
      isPublished: true,
      status: 'OPEN' as const,
      OR: [{ deadline: null }, { deadline: { gte: new Date() } }],
      AND: [
        {
          OR: [
            { Hackathon: { slug: NEXT_STOP_BREAKPOINT_SLUG } },
            { title: { contains: NEXT_STOP_BREAKPOINT_TAG } },
            { description: { contains: NEXT_STOP_BREAKPOINT_TAG } },
          ],
        },
      ],
    };

    const [totalListings, totalRewardAmount] = await Promise.all([
      prisma.bounties.count({ where: liveBountyWhere }),
      prisma.bounties.aggregate({
        _sum: { usdValue: true },
        where: liveBountyWhere,
      }),
    ]);

    setCacheHeaders(res, {
      public: true,
      maxAge: 60,
      sMaxAge: 300,
      staleWhileRevalidate: 60,
    });

    return res.status(200).json({
      totalListings,
      totalRewardAmount: totalRewardAmount._sum.usdValue || 0,
    });
  } catch (error) {
    logger.error(
      `Error fetching Next Stop Breakpoint stats: ${safeStringify(error)}`,
    );
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Internal Server Error',
    });
  }
}
