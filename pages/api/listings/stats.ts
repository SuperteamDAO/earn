/* eslint-disable no-underscore-dangle */
import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function user(_req: NextApiRequest, res: NextApiResponse) {
  const tokenPrices: any = {
    STEP: 0.00024441,
    HXRO: 0.121929,
    ORCA: 0.757812,
  };

  let total = 0;
  const stats: any = [];
  try {
    const bounties = await prisma.bounties.groupBy({
      by: ['token'],
      where: {
        isPublished: true,
        isActive: true,
        isArchived: false,
      },
      _sum: {
        rewardAmount: true,
      },
      _count: {
        id: true,
      },
    });
    bounties?.forEach((t) => {
      const token = t.token || 'OTHER';
      const tokenStatIndex = stats.findIndex((s: any) => s.token === token);
      if (tokenStatIndex >= 0) {
        stats[tokenStatIndex].count += t?._count?.id || 0;
        stats[tokenStatIndex].rewardAmount += t?._sum?.rewardAmount || 0;
        stats[tokenStatIndex].rewardAmountInUSD += tokenPrices[token]
          ? (t?._sum?.rewardAmount || 0) * tokenPrices[token]
          : t?._sum?.rewardAmount || 0;
      } else {
        stats.push({
          token,
          count: t?._count?.id || 0,
          rewardAmount: t?._sum?.rewardAmount || 0,
          rewardAmountInUSD: tokenPrices[token]
            ? (t?._sum?.rewardAmount || 0) * tokenPrices[token]
            : t?._sum?.rewardAmount || 0,
        });
      }
    });

    const grants = await prisma.grants.groupBy({
      by: ['token'],
      where: {
        isPublished: true,
        isActive: true,
        isArchived: false,
      },
      _sum: {
        rewardAmount: true,
      },
      _count: {
        id: true,
      },
    });
    grants?.forEach((t) => {
      const token = t.token || 'OTHER';
      const tokenStatIndex = stats.findIndex((s: any) => s.token === token);
      if (tokenStatIndex >= 0) {
        stats[tokenStatIndex].count += t?._count?.id || 0;
        stats[tokenStatIndex].rewardAmount += t?._sum?.rewardAmount || 0;
        stats[tokenStatIndex].rewardAmountInUSD += tokenPrices[token]
          ? (t?._sum?.rewardAmount || 0) * tokenPrices[token]
          : t?._sum?.rewardAmount || 0;
      } else {
        stats.push({
          token,
          count: t?._count?.id || 0,
          rewardAmount: t?._sum?.rewardAmount || 0,
          rewardAmountInUSD: tokenPrices[token]
            ? (t?._sum?.rewardAmount || 0) * tokenPrices[token]
            : t?._sum?.rewardAmount || 0,
        });
      }
    });

    const jobs = await prisma.jobs.aggregate({
      where: {
        private: false,
        active: true,
      },
      _count: {
        id: true,
      },
    });
    total += jobs?._count?.id || 0;
    total += stats.reduce((acc: any, s: any) => acc + s.count, 0);
    const totalTokens = stats.reduce(
      (acc: any, s: any) => acc + s.rewardAmount,
      0
    );
    const totalUSD = stats.reduce(
      (acc: any, s: any) => acc + s.rewardAmountInUSD,
      0
    );

    const getTotal = await prisma.total.findFirst();
    if (getTotal) {
      await prisma.total.update({
        where: {
          id: getTotal?.id,
        },
        data: {
          total: Math.ceil(totalTokens),
          totalInUSD: Math.ceil(totalUSD),
          count: Math.ceil(total),
        },
      });
    }
    res.status(200).json(true);
  } catch (error) {
    res.status(400).json({
      error,
      message: 'Error occurred while fetching listings',
    });
  }
}
