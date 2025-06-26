import { type SubmissionLabels } from '@prisma/client';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { checkListingSponsorAuth } from '@/features/auth/utils/checkListingSponsorAuth';
import { getSponsorSession } from '@/features/auth/utils/getSponsorSession';
import { type ProjectApplicationAi } from '@/features/listings/types';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { id } = body;
  try {
    logger.debug(`Request body: ${safeStringify(body)}`);

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        {
          error: 'Invalid ID provided',
          message: `Invalid ID provided for generating AI review context for listing with ${id}.`,
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
        label: {
          in: ['Unreviewed', 'Pending'],
        },
        status: 'Pending',
        listingId: id,
      },
      select: {
        ai: true,
        id: true,
        status: true,
        label: true,
      },
    });

    const applicationsWithAIReview = unreviewedApplications.filter(
      (u) =>
        !!u.ai &&
        (u.ai as unknown as ProjectApplicationAi)?.review?.predictedLabel !==
          'Unreviewed' &&
        (u.ai as unknown as ProjectApplicationAi)?.review?.predictedLabel !==
          'Pending',
    );

    const data = await Promise.all(
      applicationsWithAIReview.map(async (appl) => {
        const aiReview = (appl.ai as unknown as ProjectApplicationAi)?.review;
        const commitedAi = {
          ...(!!aiReview ? { review: aiReview } : {}),
          commited: true,
        };
        let correctedLabel: SubmissionLabels = appl?.label || 'Unreviewed';
        if (aiReview?.predictedLabel === 'High_Quality')
          correctedLabel = 'Shortlisted';
        if (
          aiReview?.predictedLabel === 'Mid_Quality' ||
          aiReview?.predictedLabel === 'Low_Quality'
        )
          correctedLabel = 'Reviewed';
        return await prisma.submission.update({
          where: {
            id: appl.id,
          },
          data: {
            label: correctedLabel,
            notes: aiReview?.shortNote
              ?.replace('* ', '')
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
        message: `Error occurred while committing reviewed submissions.`,
      },
      { status: 500 },
    );
  }
}
