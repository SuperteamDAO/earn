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
    identifier: `homepage_user_count:${clientIP}`,
    routeName: 'homepage-user-count',
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const userCount = await prisma.user.count();

    const errorCount = 289;

    const roundedUserCount = Math.ceil((userCount - errorCount) / 10) * 10;

    logger.info('Successfully fetched user count', {
      totalUsers: roundedUserCount,
    });

    return NextResponse.json(
      { totalUsers: roundedUserCount },
      {
        headers: {
          'Cache-Control':
            'public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600',
        },
      },
    );
  } catch (error: any) {
    logger.error('Error occurred while fetching user count', {
      error: safeStringify(error),
    });

    return NextResponse.json(
      { error: 'An error occurred while fetching the total user count' },
      { status: 500 },
    );
  }
}
