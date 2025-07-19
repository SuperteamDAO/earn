import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';

import { checkListingSponsorAuth } from '@/features/auth/utils/checkListingSponsorAuth';
import { getSponsorSession } from '@/features/auth/utils/getSponsorSession';
import { type ProjectApplicationAi } from '@/features/listings/types';

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id || typeof id !== 'string') {
    return NextResponse.json(
      {
        error: 'Invalid ID provided',
        message: `Invalid ID provided for retrieving unreviewed submissions for listing with ${id}.`,
      },
      { status: 400 },
    );
  }
  try {
    const session = await getSponsorSession(await headers());

    if (session.error || !session.data) {
      return NextResponse.json(
        { error: session.error },
        { status: session.status },
      );
    }
    const { error } = await checkListingSponsorAuth(
      session.data.userSponsorId,
      id,
    );
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    const unreviewedApplications = await prisma.submission.findMany({
      where: {
        listingId: id,
        status: 'Pending',
        label: {
          in: ['Unreviewed', 'Pending'],
        },
      },
      select: {
        id: true,
        label: true,
        ai: true,
        status: true,
      },
    });
    const hasAiReview = unreviewedApplications.filter(
      (u) =>
        !!(u.ai as unknown as ProjectApplicationAi)?.review?.predictedLabel,
    );
    const notReviewedByAI = hasAiReview.filter(
      (u) => !(u.ai as unknown as ProjectApplicationAi)?.commited,
    );
    return NextResponse.json(notReviewedByAI, { status: 200 });
  } catch (error: any) {
    logger.error(`Error occurred while retrieving unreviewed submissions`, {
      id,
    });
    return NextResponse.json(
      {
        error: error.message,
        message: `Error occurred while retrieving unreviewed submissions`,
      },
      { status: 500 },
    );
  }
}
