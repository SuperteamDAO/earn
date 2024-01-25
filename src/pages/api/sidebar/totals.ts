import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const userCount = await prisma.user.count();

    const bountiesCount = await prisma.bounties.count({
      where: {
        isPublished: true,
      },
    });

    const totalRewardAmountResult = await prisma.user.aggregate({
      _sum: {
        totalEarnedInUSD: true,
      },
    });

    const roundedUserCount = Math.ceil(userCount / 10) * 10;

    const totalRewardAmount =
      totalRewardAmountResult._sum.totalEarnedInUSD || 0;

    const roundedTotalRewardAmount = Math.ceil(totalRewardAmount / 10) * 10;

    return res.status(200).json({
      totalInUSD: roundedTotalRewardAmount,
      count: bountiesCount,
      totalUsers: roundedUserCount,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: 'An error occurred while fetching the total reward amount',
    });
  }
}
