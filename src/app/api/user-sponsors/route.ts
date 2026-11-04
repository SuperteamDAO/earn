import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { getUserSession } from '@/features/auth/utils/getUserSession';

export interface UserSponsorsResponse {
  hasSponsorMembership: boolean;
}

export async function GET(_request: NextRequest) {
  let userId: string | undefined;

  try {
    const headersList = await headers();
    const sessionResponse = await getUserSession(headersList);

    if (sessionResponse.status !== 200 || !sessionResponse.data) {
      return NextResponse.json(
        { error: sessionResponse.error },
        { status: sessionResponse.status },
      );
    }

    userId = sessionResponse.data.userId;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sponsorMembership = await prisma.userSponsors.findFirst({
      where: { userId },
      select: { userId: true },
    });

    logger.info(`Checked sponsor membership for user ID: ${userId}`);
    return NextResponse.json<UserSponsorsResponse>({
      hasSponsorMembership: sponsorMembership !== null,
    });
  } catch (error: unknown) {
    logger.error(
      `Error occurred while checking sponsor membership for user ID: ${userId ?? 'unknown'} - ${safeStringify(error)}`,
    );
    return NextResponse.json(
      {
        error: 'Unable to check sponsor membership.',
      },
      { status: 500 },
    );
  }
}
