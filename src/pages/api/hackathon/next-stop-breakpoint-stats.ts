import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

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

    return res.status(200).json({
      totalListings,
      totalRewardAmount: totalRewardAmount._sum.usdValue || 0,
    });
  } catch {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
