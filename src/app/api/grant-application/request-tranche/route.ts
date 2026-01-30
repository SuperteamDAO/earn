import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

import logger from '@/lib/logger';
import { LockNotAcquiredError, withRedisLock } from '@/lib/with-redis-lock';
import { safeStringify } from '@/utils/safeStringify';

import { getUserSession } from '@/features/auth/utils/getUserSession';
import { createTranche } from '@/features/grants/utils/createTranche';

export async function POST(request: Request) {
  try {
    const session = await getUserSession(await headers());

    if (session.error || !session.data) {
      return NextResponse.json(
        { error: session.error },
        { status: session.status },
      );
    }

    const { userId } = session.data;
    const body = await request.json();
    const {
      applicationId,
      helpWanted,
      projectUpdate,
      walletAddress,
      eventPictures,
      eventReceipts,
      attendeeCount,
      socialPost,
    } = body;

    logger.debug(`Request body: ${safeStringify(body)}`);
    logger.debug(`User ID: ${userId}`);

    if (!applicationId) {
      return NextResponse.json(
        { message: 'Application ID is required' },
        { status: 400 },
      );
    }

    if (!walletAddress) {
      return NextResponse.json(
        { message: 'Wallet address is required' },
        { status: 400 },
      );
    }

    try {
      await withRedisLock(
        `locks:create-tranche:${applicationId}`,
        async () => {
          await createTranche({
            applicationId,
            helpWanted,
            update: projectUpdate,
            walletAddress,
            eventPictures,
            eventReceipts,
            attendeeCount,
            socialPost,
          });
        },
        { ttlSeconds: 300 },
      );

      return NextResponse.json({
        message: 'Tranche requested successfully',
      });
    } catch (error: any) {
      if (error instanceof LockNotAcquiredError) {
        return NextResponse.json(
          {
            error: 'Tranche creation already in progress',
            message: `Tranche creation is already being processed for application with id=${applicationId}.`,
          },
          { status: 409 },
        );
      }
      return NextResponse.json(
        {
          error: error.message,
          message: 'Error occurred while creating tranche.',
        },
        { status: 500 },
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message,
        message: 'Error occurred while creating tranche.',
      },
      { status: 500 },
    );
  }
}
