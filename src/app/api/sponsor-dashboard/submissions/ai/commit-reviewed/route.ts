import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { type SubmissionLabels } from '@/prisma/enums';
import { safeStringify } from '@/utils/safeStringify';

import { validateListingSponsorAuth } from '@/features/auth/utils/checkListingSponsorAuth';
import { validateSession } from '@/features/auth/utils/getSponsorSession';
import { type ProjectApplicationAi } from '@/features/listings/types';
import { convertTextToNotesHTML } from '@/features/sponsor-dashboard/utils/convertTextToNotesHTML';

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

    const sessionResult = await validateSession(await headers());
    if ('error' in sessionResult) {
      return sessionResult.error;
    }
    const listingAuthResult = await validateListingSponsorAuth(
      sessionResult.session.userSponsorId,
      id,
    );
    if ('error' in listingAuthResult) {
      return listingAuthResult.error;
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
        else correctedLabel = aiReview?.predictedLabel || 'Unreviewed';
        return await prisma.submission.update({
          where: {
            id: appl.id,
          },
          data: {
            label: correctedLabel,
            notes: convertTextToNotesHTML(aiReview?.shortNote || ''),
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
