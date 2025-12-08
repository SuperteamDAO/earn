import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import logger from '@/lib/logger';
import { publicApiRateLimiter } from '@/lib/ratelimit';
import { checkAndApplyRateLimitApp } from '@/lib/rateLimiterService';
import { prisma } from '@/prisma';
import { getClientIP } from '@/utils/getClientIP';

export async function GET(_request: NextRequest) {
  const requestHeaders = await headers();
  const clientIP = getClientIP(requestHeaders);

  const rateLimitResponse = await checkAndApplyRateLimitApp({
    limiter: publicApiRateLimiter,
    identifier: `homepage_stats:${clientIP}`,
    routeName: 'homepage-stats',
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const bountiesCount = await prisma.bounties.count({
      where: { isPublished: true },
    });

    const totalRewardAmountResult = await prisma.bounties.aggregate({
      _sum: { usdValue: true },
      where: {
        isWinnersAnnounced: true,
        isPublished: true,
        status: 'OPEN',
      },
    });

    const totalApprovedGrantAmountResult =
      await prisma.grantApplication.aggregate({
        _sum: { approvedAmountInUSD: true },
        where: {
          OR: [
            { applicationStatus: 'Approved' },
            { applicationStatus: 'Completed' },
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

    return NextResponse.json(
      { totalInUSD: roundedTotalRewardAmount, count: bountiesCount },
      {
        headers: {
          'Cache-Control':
            'public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600',
        },
      },
    );
  } catch (error: any) {
    logger.error('Error occurred while fetching totals and counts', {
      error: error.message,
    });

    return NextResponse.json(
      { error: 'An error occurred while fetching the total reward amount' },
      { status: 500 },
    );
  }
}
