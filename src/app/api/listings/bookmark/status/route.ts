import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { getUserSession } from '@/features/auth/utils/getUserSession';

export async function GET(request: NextRequest) {
  const queryEntries = Object.fromEntries(
    request.nextUrl.searchParams.entries(),
  );
  logger.debug(`Request query: ${safeStringify(queryEntries)}`);

  try {
    const listingId = request.nextUrl.searchParams.get('listingId');

    if (!listingId) {
      return NextResponse.json(
        { message: 'Invalid listingId' },
        { status: 400 },
      );
    }

    logger.debug(`Fetching bookmark status for listing ID: ${listingId}`);
    const result = await prisma.subscribeBounty.findMany({
      where: { bountyId: listingId, isArchived: false },
      select: {
        bountyId: true,
        userId: true,
      },
    });

    const headerList = await headers();
    const session = await getUserSession(headerList);
    const userId = session.data?.userId ?? null;
    const response = result.map((bookmark) => ({
      ...bookmark,
      userId:
        userId && bookmark.userId && bookmark.userId === userId
          ? bookmark.userId
          : '',
    }));

    logger.info(`Fetched bookmark status for listing ID: ${listingId}`);
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(
      `Error occurred while fetching bookmark status for listing ID=${request.nextUrl.searchParams.get('listingId')}: ${safeStringify(error)}`,
    );
    return NextResponse.json(
      {
        error: message,
        message: 'Error occurred while fetching bookmark status.',
      },
      { status: 500 },
    );
  }
}
