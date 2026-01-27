import { waitUntil } from '@vercel/functions';
import dayjs from 'dayjs';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { queueAgent } from '@/features/agents/utils/queueAgent';
import { getUserSession } from '@/features/auth/utils/getUserSession';
import { grantApplicationSchema } from '@/features/grants/utils/grantApplicationSchema';
import { syncGrantApplicationWithAirtable } from '@/features/grants/utils/syncGrantApplicationWithAirtable';
import {
  isTouchingGrassSlug,
  isUserEligibleForTouchingGrass,
} from '@/features/grants/utils/touchingGrass';
import { validateGrantRequest } from '@/features/grants/utils/validateGrantRequest';
import { extractSocialUsername } from '@/features/social/utils/extractUsername';

async function updateGrantApplication(
  userId: string,
  grantId: string,
  data: any,
  grant: any,
) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
  });

  const isTouchingGrass = isTouchingGrassSlug(grant.slug);

  const validationResult = grantApplicationSchema(
    grant.minReward,
    grant.maxReward,
    grant.token,
    grant.questions,
    user as any,
    isTouchingGrass,
  ).safeParse({
    ...data,
    twitter:
      data.twitter !== undefined
        ? extractSocialUsername('twitter', data.twitter) || ''
        : undefined,
    github: !!data.github
      ? extractSocialUsername('github', data.github) || ''
      : null,
  });

  if (!validationResult.success) {
    throw new Error(JSON.stringify(validationResult.error.formErrors));
  }

  const validatedData = validationResult.data;

  const prevApplication = await prisma.grantApplication.findFirst({
    where: {
      userId,
      grantId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
    },
  });

  if (!prevApplication) {
    throw new Error('Application not found');
  }

  const formattedData = {
    userId,
    grantId,
    projectTitle: validatedData.projectTitle,
    projectOneLiner: validatedData.projectOneLiner,
    projectDetails: validatedData.projectDetails,
    projectTimeline: dayjs(validatedData.projectTimeline).format('D MMMM YYYY'),
    proofOfWork: validatedData.proofOfWork || '',
    milestones: validatedData.milestones,
    kpi: validatedData.kpi || '',
    walletAddress: validatedData.walletAddress,
    ask: validatedData.ask,
    twitter: validatedData.twitter,
    github: validatedData.github,
    answers: validatedData.answers || [],
    ...(isTouchingGrass && {
      lumaLink: validatedData.lumaLink,
      expenseBreakdown: validatedData.expenseBreakdown,
    }),
  };

  return prisma.grantApplication.update({
    where: {
      id: prevApplication.id,
    },
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
    const existingApplication = await prisma.grantApplication.findFirst({
      where: {
        grantId,
        userId,
        applicationStatus: 'Approved',
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

    const { grant, user } = await validateGrantRequest(
      userId as string,
      grantId,
    );

    const isTouchingGrass = isTouchingGrassSlug(grant.slug);

    if (grant.isPro) {
      if (isTouchingGrass) {
        if (!isUserEligibleForTouchingGrass(user)) {
          logger.debug(`User is not eligible for touching grass grant`, {
            grantId,
            userId,
            isPro: user.isPro,
            superteamLevel: user.superteamLevel,
          });
          return NextResponse.json(
            { error: 'This grant is only available to Superteam members' },
            { status: 403 },
          );
        }
      } else if (!user.isPro) {
        logger.debug(`User is not eligible for pro grant`, {
          grantId,
          userId,
        });
        return NextResponse.json(
          { error: 'This grant is only available for PRO members' },
          { status: 403 },
        );
      }
    }

    const result = await updateGrantApplication(
      userId as string,
      grantId,
      { ...applicationData, telegram },
      grant,
    );

    waitUntil(
      (async () => {
        try {
          await queueAgent({
            type: 'autoReviewGrantApplication',
            id: result.id,
          });
        } catch (error) {
          logger.error('Failed to update AI review for grant application: ', {
            error,
            grantId,
            userId,
          });
        }
        if (grant.airtableId) {
          try {
            await syncGrantApplicationWithAirtable(result);
          } catch (error) {
            logger.error('Error syncing with Airtable:', {
              error,
              userId,
              grantId,
            });
          }
        }
      })(),
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    logger.error(
      `User ${userId} unable to update grant application: ${safeStringify(error)}`,
      {
        userId,
        grantId,
      },
    );

    let statusCode = 403;
    try {
      JSON.parse(error.message);
      statusCode = 400;
    } catch {}

    return NextResponse.json(
      {
        error: error.message,
        message: `Unable to update grant application: ${error.message}`,
      },
      { status: statusCode },
    );
  }
}
