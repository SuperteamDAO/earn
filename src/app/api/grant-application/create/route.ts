import { waitUntil } from '@vercel/functions';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { dayjs } from '@/utils/dayjs';
import { safeStringify } from '@/utils/safeStringify';

import { queueAgent } from '@/features/agents/utils/queueAgent';
import { getUserSession } from '@/features/auth/utils/getUserSession';
import { queueEmail } from '@/features/emails/utils/queueEmail';
import { grantApplicationSchema } from '@/features/grants/utils/grantApplicationSchema';
import { isGrantPausedForNewApplications } from '@/features/grants/utils/pause-applications';
import { syncGrantApplicationWithAirtable } from '@/features/grants/utils/syncGrantApplicationWithAirtable';
import { validateGrantRequest } from '@/features/grants/utils/validateGrantRequest';
import { extractSocialUsername } from '@/features/social/utils/extractUsername';

async function createGrantApplication(
  userId: string,
  grantId: string,
  data: any,
  grant: any,
) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
  });

  const validationResult = grantApplicationSchema(
    grant.minReward,
    grant.maxReward,
    grant.token,
    grant.questions,
    user as any,
  ).safeParse({
    ...data,
    twitter:
      data.twitter !== undefined
        ? extractSocialUsername('twitter', data.twitter) || ''
        : undefined,
    github:
      data.github !== undefined
        ? extractSocialUsername('github', data.github) || ''
        : undefined,
  });

  if (!validationResult.success) {
    throw new Error(JSON.stringify(validationResult.error.formErrors));
  }

  const validatedData = validationResult.data;

  if (validatedData.telegram && !user.telegram) {
    await prisma.user.update({
      where: { id: userId },
      data: { telegram: validatedData.telegram },
    });
  }

  const formattedData = {
    userId,
    grantId,
    projectTitle: validatedData.projectTitle,
    projectOneLiner: validatedData.projectOneLiner,
    projectDetails: validatedData.projectDetails,
    projectTimeline: dayjs(validatedData.projectTimeline).format('D MMMM YYYY'),
    proofOfWork: validatedData.proofOfWork,
    milestones: validatedData.milestones,
    kpi: validatedData.kpi,
    walletAddress: validatedData.walletAddress,
    ask: validatedData.ask,
    twitter: validatedData.twitter,
    github: validatedData.github,
    answers: validatedData.answers || [],
  };

  return await prisma.grantApplication.create({
    data: formattedData,
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          discord: true,
          location: true,
        },
      },
      grant: {
        select: {
          airtableId: true,
          title: true,
        },
      },
    },
  });
}

export async function POST(request: NextRequest) {
  const session = await getUserSession(await headers());

  if (session.error || !session.data) {
    return NextResponse.json(
      { error: session.error },
      { status: session.status },
    );
  }
  const userId = session.data.userId;
  const body = await request.json();
  const { grantId, telegram: telegramUsername, ...applicationData } = body;

  logger.debug(`Request body: ${safeStringify(body)}`);
  const telegram = extractSocialUsername('telegram', telegramUsername);

  try {
    const { grant } = await validateGrantRequest(userId as string, grantId);
    logger.info('Grant Request validated successfully', {
      userId,
      grantId,
    });

    if (isGrantPausedForNewApplications(grant)) {
      return NextResponse.json(
        { error: 'New grant applications have been temporarily paused' },
        { status: 403 },
      );
    }

    const existingApplication = await prisma.grantApplication.findFirst({
      where: {
        grantId,
        userId,
        applicationStatus: { in: ['Pending', 'Approved'] },
      },
    });

    if (existingApplication) {
      logger.debug(`Grant Application already exists`, {
        grantId,
        userId,
      });
      return NextResponse.json(
        { error: `Grant Application already exists` },
        { status: 400 },
      );
    }

    if (grant.title.toLowerCase().includes('coindcx')) {
      const rejectedApplication = await prisma.grantApplication.findFirst({
        where: {
          grantId,
          userId,
          applicationStatus: 'Rejected',
          decidedAt: { gte: dayjs().subtract(30, 'day').toDate() },
        },
        orderBy: { decidedAt: 'desc' },
      });

      if (rejectedApplication?.decidedAt) {
        const remainingDays = Math.ceil(
          (30 * 24 * 60 * 60 * 1000 -
            new Date(rejectedApplication.decidedAt).getTime()) /
            (24 * 60 * 60 * 1000),
        );

        if (remainingDays > 0) {
          logger.debug(`User in cooldown period`, {
            grantId,
            userId,
            remainingDays,
          });
          return NextResponse.json(
            {
              error: `You must wait 30 days before reapplying for this grant.`,
            },
            { status: 429 },
          );
        }
      }
    }

    const result = await createGrantApplication(
      userId as string,
      grantId,
      { ...applicationData, telegram },
      grant,
    );

    waitUntil(
      (async () => {
        if (grant.isNative === true || !!grant.airtableId) {
          try {
            await queueEmail({
              type: 'application',
              id: result.id,
              userId: userId,
              triggeredBy: userId,
            });
          } catch (error) {
            logger.error('Error sending email to User:', {
              error,
              userId,
              grantId,
            });
          }
        }

        try {
          await queueAgent({
            type: 'autoReviewGrantApplication',
            id: result.id,
          });
        } catch (error) {
          logger.error('Failed to create AI review for grant application: ', {
            error,
            grantId,
            userId,
          });
        }

        if (grant.airtableId) {
          try {
            await syncGrantApplicationWithAirtable(result);
          } catch (error: any) {
            logger.error('Error syncing with Airtable:', {
              error: error?.response?.data || error?.message || error,
              errorMessage: error?.message,
              errorStatus: error?.response?.status,
              errorResponse: error?.response?.data,
              userId,
              grantId,
              applicationId: result.id,
              grantAirtableId: grant.airtableId,
            });
          }
        }
      })(),
    );
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    logger.error(
      `User ${userId} unable to apply for grant: ${safeStringify(error)}`,
    );
    console.error(
      `User ${userId} unable to apply for grant: ${safeStringify(error)}`,
    );

    let statusCode = 403;
    try {
      JSON.parse(error.message);
      statusCode = 400;
    } catch {}

    return NextResponse.json(
      {
        error: error.message,
        message: `Unable to submit grant application: ${error.message}`,
      },
      { status: statusCode },
    );
  }
}
