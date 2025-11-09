import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { getUserSession } from '@/features/auth/utils/getUserSession';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    logger.debug(`Request body: ${safeStringify(body)}`);

    const { listingId } = body ?? {};
    if (!listingId || typeof listingId !== 'string') {
      return NextResponse.json(
        { message: 'Invalid listingId' },
        { status: 400 },
      );
    }

    const headerList = await headers();
    const session = await getUserSession(headerList);
    const userId = session.data?.userId;

    if (!userId) {
      logger.error('Unauthorized, userId missing while toggling bookmark');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    logger.debug(
      `Fetching bookmark status for listing ID: ${listingId} and user ID: ${userId}`,
    );
    const bookmarkFound = await prisma.subscribeBounty.findFirst({
      where: { bountyId: listingId, userId },
    });

    let result;
    if (bookmarkFound) {
      logger.info(
        `Bookmark found for listing ID: ${listingId} and user ID: ${userId}, toggling isArchived status`,
      );
      result = await prisma.subscribeBounty.update({
        where: { id: bookmarkFound.id },
        data: { isArchived: !bookmarkFound.isArchived },
      });
    } else {
      logger.info(
        `No bookmark found for listing ID: ${listingId} and user ID: ${userId}, creating new bookmark`,
      );
      result = await prisma.subscribeBounty.create({
        data: { bountyId: listingId, userId: userId as string },
      });
    }

    logger.info(
      `Bookmark toggled successfully for listing ID: ${listingId} and user ID: ${userId}`,
    );
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(
      `Error occurred while toggling bookmark: ${safeStringify(error)}`,
    );
    return NextResponse.json(
      {
        error: message,
        message: 'Error occurred while toggling bookmark.',
      },
      { status: 400 },
    );
  }
}
