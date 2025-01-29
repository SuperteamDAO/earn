import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { dayjs } from '@/utils/dayjs';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithUser } from '@/features/auth/types';
import { withAuth } from '@/features/auth/utils/withAuth';
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

async function grantApplication(
  req: NextApiRequestWithUser,
  res: NextApiResponse,
) {
  const userId = req.userId;
  const { grantId, ...applicationData } = req.body;

  logger.debug(`Request body: ${safeStringify(req.body)}`);

  try {
    const { grant } = await validateGrantRequest(userId as string, grantId);

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
      throw new Error('Application already exists');
    }

    const result = await createGrantApplication(
      userId as string,
      grantId,
      applicationData,
      grant,
    );

    if (grant.isNative === true && !grant.airtableId) {
      try {
        sendEmailNotification({
          type: 'application',
          id: result.id,
          userId: userId,
          triggeredBy: userId,
        });
      } catch (err) {
        logger.error('Error sending email to User:', err);
      }
    }

    if (grant.airtableId) {
      try {
        await handleAirtableSync(result);
      } catch (err) {
        logger.error('Error syncing with Airtable:', err);
      }
    }

    return res.status(200).json('Success');
  } catch (error: any) {
    logger.error(
      `User ${userId} unable to apply for grant: ${safeStringify(error)}`,
    );

    let statusCode = 403;
    try {
      JSON.parse(error.message);
      statusCode = 400;
    } catch {}

    return res.status(statusCode).json({
      error: error.message,
      message: `Unable to submit grant application: ${error.message}`,
    });
  }
}

export default withAuth(grantApplication);
