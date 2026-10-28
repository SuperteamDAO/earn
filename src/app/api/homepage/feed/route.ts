import { type NextRequest, NextResponse } from 'next/server';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { homeFeedSelect } from '@/features/feed/constants/homeFeed';

export async function GET(_request: NextRequest) {
  try {
    const submissions = await prisma.submission.findMany({
      where: { isArchived: false, isActive: true },
      take: 5,
      select: homeFeedSelect,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(submissions, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    logger.warn(`Error`, safeStringify(error));
    return NextResponse.json(
      { error: 'Error occurred while fetching feed data.' },
      { status: 500 },
    );
  }
}
