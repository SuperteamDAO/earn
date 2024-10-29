import { status } from '@prisma/client';
import type { NextApiResponse } from 'next';

import {
  type NextApiRequestWithSponsor,
  withSponsorAuth,
} from '@/features/auth';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  try {
    const userSponsorId = req.userSponsorId;

    const sponsor = await prisma.sponsors.findUnique({
      where: { id: userSponsorId },
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
          status: status.OPEN,
          sponsorId: userSponsorId,
        },
      }),
      prisma.grantApplication.aggregate({
        _sum: { approvedAmountInUSD: true },
        where: {
          grant: { sponsorId: userSponsorId },
          OR: [
            {
              applicationStatus: 'Approved',
            },
            {
              applicationStatus: 'Completed',
            },
          ],
        },
      }),
      prisma.bounties.count({
        where: {
          sponsorId: userSponsorId,
          isActive: true,
          isArchived: false,
          status: status.OPEN,
        },
      }),
      prisma.grants.count({
        where: {
          sponsorId: userSponsorId,
          isActive: true,
          isArchived: false,
          status: status.OPEN,
        },
      }),
      prisma.grantApplication.count({
        where: {
          grant: { sponsorId: userSponsorId },
          OR: [
            {
              applicationStatus: 'Approved',
            },
            {
              applicationStatus: 'Completed',
            },
          ],
        },
      }),
      prisma.submission.count({
        where: {
          listing: {
            sponsorId: userSponsorId,
            isActive: true,
            isArchived: false,
            status: status.OPEN,
          },
        },
      }),
    ]);

    const totalRewardAmount =
      (totalListingRewards._sum.usdValue || 0) +
      (totalGrantRewards._sum.approvedAmountInUSD || 0);
    const totalListingsAndGrants = totalListings + totalGrants;
    const totalSubmissionsAndApplications =
      totalSubmissions + totalApplications;

    return res.status(200).json({
      yearOnPlatform,
      totalRewardAmount,
      totalListingsAndGrants,
      totalSubmissionsAndApplications,
    });
  } catch (error: any) {
    logger.error(
      `Error fetching sponsor statistics for user ${req.userId}: ${error.message}`,
    );
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

export default withSponsorAuth(handler);
