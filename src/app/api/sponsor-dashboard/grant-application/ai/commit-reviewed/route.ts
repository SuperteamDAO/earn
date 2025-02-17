import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { checkGrantSponsorAuth } from '@/features/auth/utils/checkGrantSponsorAuth';
import { getSponsorSession } from '@/features/auth/utils/getSponsorSession';
import { type GrantApplicationAi } from '@/features/grants/types';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { id } = body;
  try {
    logger.debug(`Request body: ${safeStringify(body)}`);

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        {
          error: 'Invalid ID provided',
          message: `Invalid ID provided for generating AI review context for grant with ${id}.`,
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
    const { error } = await checkGrantSponsorAuth(
      session.data.userSponsorId,
      id,
    );
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    const unreviewedApplications = await prisma.grantApplication.findMany({
      where: {
        label: 'Unreviewed',
        applicationStatus: 'Pending',
        grantId: id,
      },
      select: {
        ai: true,
        id: true,
        applicationStatus: true,
        label: true,
      },
    });

    const applicationsWithAIReview = unreviewedApplications.filter(
      (u) =>
        !!u.ai &&
        (u.ai as unknown as GrantApplicationAi)?.review?.predictedLabel !==
          'Unreviewed',
    );

    const data = await Promise.all(
      applicationsWithAIReview.map(async (appl) => {
        const aiReview = (appl.ai as unknown as GrantApplicationAi)?.review;
        const commitedAi = {
          ...(!!aiReview ? { review: aiReview } : {}),
          commited: true,
        };
        return await prisma.grantApplication.update({
          where: {
            id: appl.id,
          },
          data: {
            label: aiReview?.predictedLabel,
            notes: aiReview?.shortNote
              .split(/(?<=[.!?])\s+/)
              .filter((sentence) => sentence.trim().length > 0)
              .map((sentence) => `• ${sentence.trim()}`)
              .join('\n'),
            ai: commitedAi,
          },
        });
      }),
    );

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message,
        message: `Error occurred while committing reviewed grant applications.`,
      },
      { status: 500 },
    );
  }
}
