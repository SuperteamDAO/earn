import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const hackathonSlug = req.query.slug as string;

    const hackathon = await prisma.hackathon.findUnique({
      where: { slug: hackathonSlug },
    });

    if (!hackathon) {
      return res.status(404).json({ error: 'Hackathon not found' });
    }

    const listingsWhere = {
      hackathonId: hackathon.id,
      isActive: true,
      isArchived: false,
      status: 'OPEN' as const,
      isPublished: true,
    };

    const totalListings = await prisma.bounties.count({
      where: listingsWhere,
    });

    const totalRewardAmount = await prisma.bounties.aggregate({
      _sum: {
        usdValue: true,
      },
      where: listingsWhere,
    });

    return res.status(200).json({
      totalRewardAmount: totalRewardAmount._sum.usdValue || 0,
      totalListings,
      deadline: hackathon.deadline,
      startDate: hackathon.startDate,
      announceDate: hackathon.announceDate,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
