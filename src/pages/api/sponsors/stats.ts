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

    const user = await prisma.user.findUnique({
      where: {
        id: userId as string,
      },
    });

    if (!user || !user.currentSponsorId) {
      return res
        .status(403)
        .json({ error: 'User does not have a current sponsor.' });
    }

    const sponsorId = user.currentSponsorId;

    if (!sponsorId) {
      return res.status(400).json({ error: 'Sponsor ID is required' });
    }

    const sponsor = await prisma.sponsors.findUnique({
      where: { id: sponsorId },
      select: { createdAt: true, totalRewardedInUSD: true },
    });

    if (!sponsor) {
      return res.status(404).json({ error: 'Sponsor not found' });
    }

    const yearOnPlatform = sponsor.createdAt.getFullYear();

    const commonWhere = {
      sponsorId,
      isWinnersAnnounced: true,
      isActive: true,
      isArchived: false,
      status: status.OPEN,
    };

    const totalListings = await prisma.bounties.count({
      where: commonWhere,
    });

    const totalSubmissions = await prisma.submission.count({
      where: {
        listing: commonWhere,
      },
    });

    return res.status(200).json({
      yearOnPlatform,
      totalRewardAmount: sponsor.totalRewardedInUSD,
      totalListings,
      totalSubmissions,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
