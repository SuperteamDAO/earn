import { status } from '@prisma/client';
import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  try {
    const userId = req.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId as string },
    });

    if (!user || !user.currentSponsorId) {
      return res
        .status(403)
        .json({ error: 'User does not have a current sponsor.' });
    }

    const sponsorId = user.currentSponsorId;

    const sponsor = await prisma.sponsors.findUnique({
      where: { id: sponsorId },
      select: { createdAt: true },
    });

    if (!sponsor) {
      return res.status(404).json({ error: 'Sponsor not found' });
    }

    const yearOnPlatform = sponsor.createdAt.getFullYear();

    const [
      totalListingRewards,
      totalGrantRewards,
      totalListings,
      totalGrants,
      totalApplications,
      totalSubmissions,
    ] = await Promise.all([
      prisma.bounties.aggregate({
        _sum: { usdValue: true },
        where: {
          isWinnersAnnounced: true,
          isPublished: true,
          status: 'OPEN',
          sponsorId,
        },
      }),
      prisma.grants.aggregate({
        _sum: { totalPaid: true },
        where: { sponsorId },
      }),
      prisma.bounties.count({
        where: {
          sponsorId,
          isActive: true,
          isArchived: false,
          status: status.OPEN,
        },
      }),
      prisma.grants.count({
        where: {
          sponsorId,
          isActive: true,
          isArchived: false,
          status: status.OPEN,
        },
      }),
      prisma.grantApplication.count({
        where: {
          grant: { sponsorId },
          applicationStatus: 'Approved',
        },
      }),
      prisma.submission.count({
        where: {
          listing: {
            sponsorId,
            isActive: true,
            isArchived: false,
            status: status.OPEN,
          },
        },
      }),
    ]);

    const totalRewardAmount =
      (totalListingRewards._sum.usdValue || 0) +
      (totalGrantRewards._sum.totalPaid || 0);
    const totalListingsAndGrants = totalListings + totalGrants;
    const totalSubmissionsAndApplications =
      totalSubmissions + totalApplications;

    return res.status(200).json({
      yearOnPlatform,
      totalRewardAmount,
      totalListingsAndGrants,
      totalSubmissionsAndApplications,
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

export default withAuth(handler);
