import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';

import { validateListingSponsorAuth } from '@/features/auth/utils/checkListingSponsorAuth';
import { validateSession } from '@/features/auth/utils/getSponsorSession';
import {
  type BountiesAi,
  type BountySubmissionAi,
  type ProjectApplicationAi,
} from '@/features/listings/types';

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
    const listing = listingAuthResult.listing;

    if (listing.type === 'bounty') {
      if (!(listing.ai as unknown as BountiesAi)?.evaluationCompleted) {
        return NextResponse.json(
          {
            error: 'Evaluation not completed',
            message: `Evaluation not completed for listing with ${id}.`,
          },
          { status: 400 },
        );
      }
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

    let hasAiReview;
    if (listing.type === 'bounty') {
      hasAiReview = unreviewedApplications.filter(
        (u) => !!(u.ai as unknown as BountySubmissionAi)?.evaluation,
      );
    } else {
      hasAiReview = unreviewedApplications.filter(
        (u) =>
          !!(u.ai as unknown as ProjectApplicationAi)?.review?.predictedLabel,
      );
    }

    const notReviewedByAI = hasAiReview.filter(
      (u) => !(u.ai as unknown as ProjectApplicationAi)?.commited,
    );

    if (listing.type === 'bounty') {
      const needsReviewCount = unreviewedApplications.filter((u) => {
        const aiData = u.ai as unknown as BountySubmissionAi;
        return aiData?.evaluation?.finalLabel === 'Needs_Review';
      }).length;

      const totalSubmissions = unreviewedApplications.length;
      const needsReviewPercentage =
        totalSubmissions > 0 ? (needsReviewCount / totalSubmissions) * 100 : 0;

      if (needsReviewPercentage >= 50) {
        return NextResponse.json(
          {
            error: `More than 50% of submissions have 'Needs Review' label`,
            message: `More than 50% of submissions have 'Needs Review' label for listing with ${id}.`,
          },
          { status: 400 },
        );
      }
    }

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
