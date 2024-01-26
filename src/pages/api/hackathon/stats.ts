import { status } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

import { prisma } from '@/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const token = await getToken({ req });

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = token.id;

    if (!userId) {
      return res.status(400).json({ error: 'Invalid token' });
    }

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

    return res.status(200).json({
      name: hackathon.name,
      logo: hackathon.logo,
      totalRewardAmount: 400,
      totalListings,
      totalSubmissions,
    });
  } catch (error) {
    return res.status(500).json({ error: error });
  }
}
