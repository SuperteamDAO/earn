import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

import logger from '@/lib/logger';
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
    const { applicationId, helpWanted, projectUpdate, walletAddress } = body;

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

    await createTranche({
      applicationId,
      helpWanted,
      update: projectUpdate,
      walletAddress,
    });

    return NextResponse.json({
      message: 'Tranche requested successfully',
    });
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
