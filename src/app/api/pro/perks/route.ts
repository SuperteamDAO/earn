import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';

import { getUserSession } from '@/features/auth/utils/getUserSession';

export async function GET() {
  try {
    const headersList = await headers();
    const sessionResponse = await getUserSession(headersList);

    let isPro = false;

    if (sessionResponse.status === 200 && sessionResponse.data) {
      const user = await prisma.user.findUnique({
        where: { id: sessionResponse.data.userId },
        select: { isPro: true },
      });
      isPro = user?.isPro ?? false;
    }

    const perks = await prisma.proPerks.findMany({
      orderBy: { id: 'asc' },
      select: {
        id: true,
        header: true,
        description: true,
        cta: true,
        logo: true,
        ...(isPro ? { ctaLink: true } : {}),
      },
    });

    return NextResponse.json(perks, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    logger.error('Error fetching pro perks:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
