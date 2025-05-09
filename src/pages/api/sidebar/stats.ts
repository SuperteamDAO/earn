import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { setCacheHeaders } from '@/utils/cacheControl';

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const bountiesCount = await prisma.bounties.count({
      where: {
        isPublished: true,
      },
    });

    const totalRewardAmountResult = await prisma.bounties.aggregate({
      _sum: {
        usdValue: true,
      },
      where: {
        OR: [
          {
            isWinnersAnnounced: true,
          },
          {
            type: 'sponsorship',
          },
        ],
        isPublished: true,
        status: 'OPEN',
      },
    });

    const totalApprovedGrantAmountResult =
      await prisma.grantApplication.aggregate({
        _sum: {
          approvedAmountInUSD: true,
        },
        where: {
          OR: [
            {
              applicationStatus: 'Approved',
            },
            {
              applicationStatus: 'Completed',
            },
          ],
        },
      });

    const totalListingRewardAmount = totalRewardAmountResult._sum.usdValue || 0;
    const totalApprovedGrantAmount =
      totalApprovedGrantAmountResult._sum.approvedAmountInUSD || 0;

    const roundedTotalRewardAmount =
      Math.ceil((totalListingRewardAmount + totalApprovedGrantAmount) / 10) *
      10;

    logger.info('Successfully fetched counts and totals', {
      totalInUSD: roundedTotalRewardAmount,
      count: bountiesCount,
    });

    setCacheHeaders(res, {
      public: true,
      // 1 day
      maxAge: 24 * 60 * 60,
      sMaxAge: 24 * 60 * 60,
      staleWhileRevalidate: 60 * 60, // 1 hour
    });

    return res.status(200).json({
      totalInUSD: roundedTotalRewardAmount,
      count: bountiesCount,
    });
  } catch (error: any) {
    logger.error('Error occurred while fetching totals and counts', {
      error: error.message,
    });

    return res.status(500).json({
      error: 'An error occurred while fetching the total reward amount',
    });
  }
}
