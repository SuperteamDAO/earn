import { status } from '@prisma/client';
import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { prisma } from '@/prisma';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  try {
    const userId = req.userId;

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

    const totalListings = await prisma.bounties.count({
      where: {
        sponsorId,
        isActive: true,
        isArchived: false,
        status: status.OPEN,
      },
    });

    const totalSubmissions = await prisma.submission.count({
      where: {
        listing: {
          sponsorId,
          isActive: true,
          isArchived: false,
          status: status.OPEN,
        },
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

export default withAuth(handler);
