import { type NextRequest, NextResponse } from 'next/server';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

export async function GET(_request: NextRequest) {
  try {
    const sponsorCount = await prisma.sponsors.count();

    const roundedSponsorCount = Math.ceil(sponsorCount / 10) * 10;

    logger.info('Successfully fetched sponsor count', {
      totalSponsors: roundedSponsorCount,
    });

    return NextResponse.json(
      { totalSponsors: roundedSponsorCount },
      {
        headers: {
          'Cache-Control':
            'public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600',
        },
      },
    );
  } catch (error: any) {
    logger.error('Error occurred while fetching sponsor count', {
      error: safeStringify(error),
    });

    return NextResponse.json(
      { error: 'An error occurred while fetching the total sponsor count' },
      { status: 500 },
    );
  }
}
