/* eslint-disable no-underscore-dangle */
import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    // const userCount = await prisma.user.count({
    //   where: {
    //     isTalentFilled: true,
    //   },
    // });

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

    const totalRewardAmount =
      totalRewardAmountResult._sum.totalEarnedInUSD || 0;

    const roundedTotalRewardAmount = Math.ceil(totalRewardAmount / 10) * 10;

    await prisma.total.updateMany({
      data: {
        count: bountiesCount,
        totalInUSD: roundedTotalRewardAmount,
      },
    });

    return res.status(200).json({
      totalInUSD: roundedTotalRewardAmount,
      count: bountiesCount,
      totalUsers: 4097,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: 'An error occurred while fetching the total reward amount',
    });
  }
}
