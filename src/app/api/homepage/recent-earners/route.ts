import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import logger from '@/lib/logger';
import { publicApiRateLimiter } from '@/lib/ratelimit';
import { checkAndApplyRateLimitApp } from '@/lib/rateLimiterService';
import { prisma } from '@/prisma';
import { getClientIP } from '@/utils/getClientIP';

import type { Rewards } from '@/features/listings/types';

export async function GET(_request: NextRequest) {
  const requestHeaders = await headers();
  const clientIP = getClientIP(requestHeaders);

  const rateLimitResponse = await checkAndApplyRateLimitApp({
    limiter: publicApiRateLimiter,
    identifier: `homepage_recent_earners:${clientIP}`,
    routeName: 'homepage-recent-earners',
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const winningSubmissions = await prisma.submission.findMany({
      where: {
        isWinner: true,
        listing: { isWinnersAnnounced: true, isPrivate: false },
        rewardInUSD: { gte: 200 },
      },
      select: {
        winnerPosition: true,
        user: {
          select: {
            id: true,
            username: true,
            photo: true,
            firstName: true,
            lastName: true,
          },
        },
        listing: {
          select: {
            slug: true,
            title: true,
            rewards: true,
            token: true,
            winnersAnnouncedAt: true,
          },
        },
      },
      take: 30,
      orderBy: { listing: { winnersAnnouncedAt: 'desc' } },
    });

    const earners = winningSubmissions.map((submission) => {
      const rewards = submission.listing.rewards as Rewards;
      return {
        id: submission.user.id,
        username: submission.user.username,
        firstName: submission.user.firstName,
        lastName: submission.user.lastName,
        slug: submission.listing.slug,
        title: submission.listing.title,
        reward: rewards[Number(submission.winnerPosition) as keyof Rewards],
        rewardToken: submission.listing.token,
        photo: submission.user.photo,
        winnersAnnouncedAt: submission.listing.winnersAnnouncedAt,
      };
    });

    logger.info('Successfully fetched winning submissions');

    return NextResponse.json(earners, {
      headers: {
        'Cache-Control':
          'public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600',
      },
    });
  } catch (error: any) {
    logger.error('Error occurred while fetching winning submissions', {
      error: error.message,
    });
    return NextResponse.json(
      { error: error.message, message: 'Error occurred while fetching totals' },
      { status: 400 },
    );
  }
}
