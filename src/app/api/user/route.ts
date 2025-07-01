import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { userSelectOptions } from '@/features/auth/constants/userSelectOptions';
import { getUserSession } from '@/features/auth/utils/getUserSession';

export async function GET(_request: NextRequest) {
  try {
    const headersList = await headers();
    const sessionResponse = await getUserSession(headersList);

    if (sessionResponse.status !== 200 || !sessionResponse.data) {
      logger.warn(`Authentication failed: ${sessionResponse.error}`);
      return NextResponse.json(
        { error: sessionResponse.error },
        { status: sessionResponse.status },
      );
    }

    const { privyDid } = sessionResponse.data;

    const result = await prisma.user.findUnique({
      where: { privyDid },
      select: userSelectOptions,
    });

    if (!result) {
      logger.warn(`User not found for privyDid: ${privyDid}`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    logger.info(`User data retrieved successfully: ${safeStringify(result)}`);
    return NextResponse.json(result);
  } catch (err) {
    logger.error(
      `Error occurred while processing the request: ${safeStringify(err)}`,
    );
    return NextResponse.json(
      { error: 'Error occurred while processing the request.' },
      { status: 500 },
    );
  }
}
