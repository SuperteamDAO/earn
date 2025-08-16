import { type SubmissionLabels } from '@prisma/client';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { cleanRewards } from '@/utils/rank';
import { safeStringify } from '@/utils/safeStringify';

import { validateListingSponsorAuth } from '@/features/auth/utils/checkListingSponsorAuth';
import { validateSession } from '@/features/auth/utils/getSponsorSession';
import {
  type BountiesAi,
  type BountySubmissionAi,
  type ProjectApplicationAi,
  type Rewards,
} from '@/features/listings/types';
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

    const listing = listingAuthResult.listing;

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

    if (listing.type === 'project') {
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
    }
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
      const submissionsWithAiEvaluation = unreviewedApplications.filter(
        (u) => !!(u.ai as unknown as BountySubmissionAi)?.evaluation,
      );

      const submissionsWithFinalLabel = submissionsWithAiEvaluation.filter(
        (u) =>
          !!(u.ai as unknown as BountySubmissionAi)?.evaluation?.finalLabel,
      );

      const submissionsWithoutFinalLabel = submissionsWithAiEvaluation.filter(
        (u) => !(u.ai as unknown as BountySubmissionAi)?.evaluation?.finalLabel,
      );

      const processedWithFinalLabel = await Promise.all(
        submissionsWithFinalLabel.map(async (submission) => {
          const ai = submission.ai as unknown as BountySubmissionAi;
          const commitedAi = {
            ...(!!ai ? ai : {}),
            commited: true,
          };

          return await prisma.submission.update({
            where: { id: submission.id },
            data: {
              label: ai?.evaluation?.finalLabel || 'Unreviewed',
              notes: convertTextToNotesHTML(ai?.evaluation?.notes || ''),
              ai: commitedAi,
            },
          });
        }),
      );

      let processedWithoutFinalLabel: any[] = [];

      if (submissionsWithoutFinalLabel.length > 0) {
        const sortedSubmissions = submissionsWithoutFinalLabel.sort((a, b) => {
          const scoreA =
            (a.ai as unknown as BountySubmissionAi)?.evaluation?.totalScore ||
            0;
          const scoreB =
            (b.ai as unknown as BountySubmissionAi)?.evaluation?.totalScore ||
            0;
          return scoreB - scoreA;
        });

        const totalSubmissions = sortedSubmissions.length;

        const podiums = listing.rewards
          ? cleanRewards(listing.rewards as Rewards, true).length
          : 0;

        const top10Percent = Math.ceil(totalSubmissions * 0.1);

        const minShortlistedCount = Math.max(top10Percent, podiums + 3);

        const maxShortlistedCap = podiums <= 5 ? 10 : 15;

        const finalShortlistedCount = Math.min(
          minShortlistedCount,
          maxShortlistedCap,
        );

        const bottom20Percentile = Math.ceil(totalSubmissions * 0.2);

        processedWithoutFinalLabel = await Promise.all(
          sortedSubmissions.map(async (submission, index) => {
            const ai = submission.ai as unknown as BountySubmissionAi;
            const commitedAi = {
              ...(!!ai ? ai : {}),
              commited: true,
            };

            let label: SubmissionLabels = 'Unreviewed';

            if (index < finalShortlistedCount) {
              label = 'Shortlisted';
            } else if (index >= totalSubmissions - bottom20Percentile) {
              label = 'Low_Quality';
            } else {
              label = 'Mid_Quality';
            }

            return await prisma.submission.update({
              where: { id: submission.id },
              data: {
                label,
                notes: convertTextToNotesHTML(ai?.evaluation?.notes || ''),
                ai: commitedAi,
              },
            });
          }),
        );
      }

      const allProcessedSubmissions = [
        ...processedWithFinalLabel,
        ...processedWithoutFinalLabel,
      ];
      return NextResponse.json(allProcessedSubmissions);
    }

    return NextResponse.json(
      {
        error: 'Unsupported listing type',
        message: `Listing type '${listing.type}' is not supported for AI review commitment.`,
      },
      { status: 400 },
    );
  } catch (error: any) {
    console.log(error);
    return NextResponse.json(
      {
        error: error.message,
        message: `Error occurred while committing reviewed submissions.`,
      },
      { status: 500 },
    );
  }
}
