import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { getSponsorSession } from '@/features/auth/utils/getSponsorSession';
import { type GrantApplicationAi } from '@/features/grants/types';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { id } = body;
  try {
    logger.debug(`Request body: ${safeStringify(body)}`);

    console.log('id - ', id);
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

    console.log('unreviewedApplications', unreviewedApplications);
    const applicationsWithAIReview = unreviewedApplications.filter(
      (u) =>
        !!u.ai &&
        (u.ai as unknown as GrantApplicationAi)?.review?.predictedLabel !==
          'Unreviewed',
    );
    console.log('applicationsWithAIReview', applicationsWithAIReview);

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
            notes: '• ' + aiReview?.shortNote,
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
