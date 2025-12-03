import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import logger from '@/lib/logger';
import { publicApiRateLimiter } from '@/lib/ratelimit';
import { checkAndApplyRateLimitApp } from '@/lib/rateLimiterService';
import { prisma } from '@/prisma';
import { getClientIP } from '@/utils/getClientIP';
import { safeStringify } from '@/utils/safeStringify';

export async function GET(_request: NextRequest) {
  const requestHeaders = await headers();
  const clientIP = getClientIP(requestHeaders);

  const rateLimitResponse = await checkAndApplyRateLimitApp({
    limiter: publicApiRateLimiter,
    identifier: `homepage_feed:${clientIP}`,
    routeName: 'homepage-feed',
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const submissions = await prisma.submission.findMany({
      where: { isArchived: false, isActive: true },
      take: 5,
      select: {
        createdAt: true,
        isWinner: true,
        listing: { select: { type: true, isWinnersAnnounced: true } },
        user: { select: { firstName: true, lastName: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(submissions, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      },
    });
  } catch (error: any) {
    logger.warn(`Error`, safeStringify(error));
    return NextResponse.json(
      { error: 'Error occurred while fetching feed data.' },
      { status: 500 },
    );
  }
}
