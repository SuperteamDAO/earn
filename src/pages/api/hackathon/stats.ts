import { status } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

import { prisma } from '@/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const hackathonSlug = req.query.slug as string;

    const token = await getToken({ req });
    const userId = token?.id;

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
        usdValue: true,
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
      totalRewardAmount: totalRewardAmount._sum.usdValue || 0,
      totalListings,
      totalSubmissions,
    });
  } catch (error) {
    return res.status(500).json({ error: error });
  }
}
