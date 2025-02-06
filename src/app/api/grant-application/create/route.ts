import { waitUntil } from '@vercel/functions';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import earncognitoClient from '@/lib/earncognitoClient';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { dayjs } from '@/utils/dayjs';
import { safeStringify } from '@/utils/safeStringify';

import { getUserSession } from '@/features/auth/utils/getUserSession';
import { sendEmailNotification } from '@/features/emails/utils/sendEmailNotification';
import { grantApplicationSchema } from '@/features/grants/utils/grantApplicationSchema';
import { handleAirtableSync } from '@/features/grants/utils/handleAirtableSync';
import { validateGrantRequest } from '@/features/grants/utils/validateGrantRequest';
import { extractSocialUsername } from '@/features/social/utils/extractUsername';

async function createGrantApplication(
  userId: string,
  grantId: string,
  data: any,
  grant: any,
) {
  const validationResult = grantApplicationSchema(
    grant.minReward,
    grant.maxReward,
    grant.token,
    grant.questions,
  ).safeParse({
    ...data,
    twitter:
      data.twitter !== undefined
        ? extractSocialUsername('twitter', data.twitter) || ''
        : undefined,
  });

  if (!validationResult.success) {
    throw new Error(JSON.stringify(validationResult.error.formErrors));
  }

  const validatedData = validationResult.data;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { publicKey: true },
  });
  if (!user?.publicKey && validatedData.walletAddress) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        publicKey: validatedData.walletAddress,
      },
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
    answers: validatedData.answers || [],
  };

  return prisma.grantApplication.create({
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
  const { grantId, ...applicationData } = body;

  logger.debug(`Request body: ${safeStringify(body)}`);

  try {
    const { grant } = await validateGrantRequest(userId as string, grantId);
    logger.info('Grant Request validated successfully', {
      userId,
      grantId,
    });

    const existingApplication = await prisma.grantApplication.findFirst({
      where: {
        grantId,
        userId,
        applicationStatus: {
          in: ['Pending', 'Approved'],
        },
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

    const result = await createGrantApplication(
      userId as string,
      grantId,
      applicationData,
      grant,
    );

    waitUntil(
      (async () => {
        if (grant.isNative === true && !grant.airtableId) {
          try {
            sendEmailNotification({
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

        if (grant.airtableId) {
          try {
            await handleAirtableSync(result);
          } catch (error) {
            logger.error('Error syncing with Airtable:', {
              error,
              userId,
              grantId,
            });
          }
        }
        try {
          await earncognitoClient.post('/ai/grants/review-application', {
            id: result.id,
          });
        } catch (error) {
          logger.error('Failed to create AI review for grant application: ', {
            error,
            grantId,
            userId,
          });
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
