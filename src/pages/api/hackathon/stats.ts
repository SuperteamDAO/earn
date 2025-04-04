import type { NextApiResponse } from 'next';

import { prisma } from '@/prisma';

import { type NextApiRequestWithUser } from '@/features/auth/types';
import { withAuth } from '@/features/auth/utils/withAuth';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  try {
    const hackathonSlug = req.query.slug as string;

    const userId = req.userId;

    const user = await prisma.user.findUnique({
      where: {
        id: userId as string,
      },
    });

    let hackathon;
    if (user && user.hackathonId) {
      hackathon = await prisma.hackathon.findUnique({
        where: { id: user.hackathonId },
        include: {
          listings: true,
        },
      });
    } else {
      hackathon = await prisma.hackathon.findUnique({
        where: { slug: hackathonSlug },
        include: {
          listings: true,
        },
      });
    }

    if (!hackathon) {
      return res.status(404).json({ error: 'Hackathon not found' });
    }

    const totalListings = await prisma.bounties.count({
      where: {
        hackathonId: hackathon.id,
        isActive: true,
        isArchived: false,
        status: 'OPEN',
        isPublished: true,
      },
    });

    const totalSubmissions = await prisma.submission.count({
      where: {
        listing: {
          hackathonId: hackathon.id,
          isActive: true,
          isArchived: false,
          status: 'OPEN',
        },
      },
    });

    const totalRewardAmount = await prisma.bounties.aggregate({
      _sum: {
        usdValue: true,
      },
      where: {
        hackathonId: hackathon.id,
        isActive: true,
        isArchived: false,
        status: 'OPEN',
        isPublished: true,
      },
    });

    return res.status(200).json({
      name: hackathon.name,
      logo: hackathon.altLogo,
      totalRewardAmount: totalRewardAmount._sum.usdValue || 0,
      totalListings,
      totalSubmissions,
    });
  } catch (error) {
    console.trace(error);
    return res.status(500).json({ error: error });
  }
}

export default withAuth(handler);
