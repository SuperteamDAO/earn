import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import earncognitoClient from '@/lib/earncognitoClient';
import logger from '@/lib/logger';
import { safeStringify } from '@/utils/safeStringify';

import { getSponsorSession } from '@/features/auth/utils/getSponsorSession';
import { type EvaluationResult } from '@/features/grants/types';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { id } = body;
  try {
    logger.debug(`Request body: ${safeStringify(body)}`);

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        {
          error: 'Invalid ID provided',
          message: `Invalid ID provided for reviewing grant application grant with ${id}.`,
        },
        { status: 400 },
      );
    }

    const session = await getSponsorSession(await headers());

    if (session.error || !session.data) {
      return NextResponse.json(
        { error: session.error },
        { status: session.status },
      );
    }

    const data = await earncognitoClient.post<EvaluationResult>(
      '/ai/grants/review-application',
      {
        id,
      },
    );
    return NextResponse.json(data.data, { status: 200 });
  } catch (error: any) {
    logger.error(
      `Error occurred while committing reviewed grant applications`,
      {
        id,
      },
    );
    return NextResponse.json(
      {
        error: error.message,
        message: `Error occurred while committing reviewed grant applications.`,
      },
      { status: 500 },
    );
  }
}
