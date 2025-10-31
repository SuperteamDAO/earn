import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { status } from '@/prisma/enums';

import { type NextApiRequestWithSponsor } from '@/features/auth/types';
import { withSponsorAuth } from '@/features/auth/utils/withSponsorAuth';

export type SponsorStats = {
  yearOnPlatform: number;
  totalRewardAmount: number;
  totalListingsAndGrants: number;
  totalSubmissionsAndApplications: number;
  completionRate: number;
};

export async function getSponsorStats(
  sponsorId: string,
): Promise<SponsorStats | null> {
  const sponsor = await prisma.sponsors.findUnique({
    where: { id: sponsorId },
    select: { createdAt: true },
  });

  if (!sponsor) {
    return null;
  }

  const yearOnPlatform = sponsor.createdAt.getFullYear();

  const [
    totalListingRewards,
    totalGrantRewards,
    totalListings,
    totalGrants,
    totalApplications,
    totalSubmissions,
    eligibleBounties,
  ] = await Promise.all([
    prisma.bounties.aggregate({
      _sum: { usdValue: true },
      where: {
        isWinnersAnnounced: true,
        isPublished: true,
        status: status.OPEN,
        sponsorId,
      },
    }),
    prisma.grantApplication.aggregate({
      _sum: { approvedAmountInUSD: true },
      where: {
        grant: { sponsorId },
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
          sponsorId,
          isActive: true,
          isArchived: false,
          status: status.OPEN,
        },
      },
    }),
    prisma.bounties.findMany({
      where: {
        sponsorId,
        isPublished: true,
        isPrivate: false,
        type: {
          in: ['bounty', 'hackathon'],
        },
        deadline: {
          lt: new Date(),
        },
      },
      select: {
        id: true,
        isWinnersAnnounced: true,
        _count: {
          select: {
            Submission: true,
          },
        },
      },
    }),
  ]);

  const eligibleBountiesWithMinSubmissions = eligibleBounties.filter(
    (b) => b._count.Submission >= 3,
  );

  const completedBounties = eligibleBountiesWithMinSubmissions.filter(
    (b) => b.isWinnersAnnounced,
  ).length;

  const totalRewardAmount =
    (totalListingRewards._sum.usdValue || 0) +
    (totalGrantRewards._sum.approvedAmountInUSD || 0);
  const totalListingsAndGrants = totalListings + totalGrants;
  const totalSubmissionsAndApplications = totalSubmissions + totalApplications;

  const completionRate =
    eligibleBountiesWithMinSubmissions.length > 0
      ? (completedBounties / eligibleBountiesWithMinSubmissions.length) * 100
      : 0;
  console.log('completionRate', completionRate);
  console.log('completedBounties', completedBounties);
  console.log(
    'eligibleBountiesWithMinSubmissions',
    eligibleBountiesWithMinSubmissions.length,
  );

  return {
    yearOnPlatform,
    totalRewardAmount,
    totalListingsAndGrants,
    totalSubmissionsAndApplications,
    completionRate,
  };
}

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  try {
    if (!req.userSponsorId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const stats = await getSponsorStats(req.userSponsorId);

    if (!stats) {
      return res.status(404).json({ error: 'Sponsor not found' });
    }

    return res.status(200).json(stats);
  } catch (error: any) {
    logger.error(
      `Error fetching sponsor statistics for user ${req.userId}: ${error.message}`,
    );
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

export default withSponsorAuth(handler);
