import { type NextRequest, NextResponse } from 'next/server';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

export async function GET(_request: NextRequest) {
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
