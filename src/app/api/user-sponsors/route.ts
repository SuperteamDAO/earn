import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { getUserSession } from '@/features/auth/utils/getUserSession';

export async function GET(_request: NextRequest) {
  try {
    const headersList = await headers();
    const sessionResponse = await getUserSession(headersList);

    if (sessionResponse.status !== 200 || !sessionResponse.data) {
      return NextResponse.json(
        { error: sessionResponse.error },
        { status: sessionResponse.status },
      );
    }

    const { userId } = sessionResponse.data;

    const result = await prisma.userSponsors.findMany({
      where: { userId },
      orderBy: { updatedAt: 'asc' },
      include: { sponsor: true },
    });

    logger.info(`Fetched user sponsors for user ID: ${userId}`);
    return NextResponse.json(result);
  } catch (error: any) {
    const { userId } = (await getUserSession(await headers())).data || {};
    logger.error(
      `Error occurred while fetching user sponsors for user ID: ${userId} - ${safeStringify(error)}`,
    );
    return NextResponse.json(
      {
        error,
        message: 'Error occurred while fetching user sponsors.',
      },
      { status: 400 },
    );
  }
}
