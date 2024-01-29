import { status } from '@prisma/client';
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
      include: {
        listings: true,
      },
    });

    if (!hackathon) {
      return res.status(404).json({ error: 'Hackathon not found' });
    }

    const totalListings = await prisma.bounties.count({
      where: {
        hackathonId: hackathon.id,
        isActive: true,
        isArchived: false,
        status: status.OPEN,
      },
    });

    const totalSubmissions = await prisma.submission.count({
      where: {
        listing: {
          hackathonId: hackathon.id,
          isActive: true,
          isArchived: false,
          status: status.OPEN,
        },
      },
    });

    const totalRewardAmount = await prisma.bounties.aggregate({
      _sum: {
        rewardAmount: true,
      },
      where: {
        hackathonId: hackathon.id,
        isActive: true,
        isArchived: false,
        status: status.OPEN,
      },
    });

    return res.status(200).json({
      name: hackathon.name,
      logo: hackathon.logo,
      totalRewardAmount: totalRewardAmount._sum.rewardAmount || 0,
      totalListings,
      totalSubmissions,
    });
  } catch (error) {
    return res.status(500).json({ error: error });
  }
}
