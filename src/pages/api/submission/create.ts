import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithUser } from '@/features/auth/types';
import { withAuth } from '@/features/auth/utils/withAuth';
import { sendEmailNotification } from '@/features/emails/utils/sendEmailNotification';
import { submissionSchema } from '@/features/listings/utils/submissionFormSchema';
import { validateSubmissionRequest } from '@/features/listings/utils/validateSubmissionRequest';

async function createSubmission(
  userId: string,
  listingId: string,
  data: any,
  listing: any,
) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
  const validationResult = submissionSchema(
    listing,
    listing.minRewardAsk || 0,
    listing.maxRewardAsk || 0,
    user as any,
  ).safeParse(data);

  const isSponsorship = listing.type === 'sponsorship';

  if (!validationResult.success) {
    throw new Error(JSON.stringify(validationResult.error.formErrors));
  }

  const validatedData = validationResult.data;

  if (validatedData.publicKey) {
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        publicKey: validatedData.publicKey,
      },
    });
  }

  const existingSubmissions = await prisma.submission.findMany({
    where: { userId, listingId },
  });

  if (!isSponsorship && existingSubmissions.length > 0)
    throw new Error('Submission already exists');

  if (
    isSponsorship &&
    existingSubmissions.some((submission) => submission.label === 'Spam')
  )
    throw new Error('User submissions has been flagged as spam');

  if (
    isSponsorship &&
    !existingSubmissions.every(
      (submission) => submission.status === 'Rejected' || submission.isPaid,
    )
  )
    throw new Error('User already has an active sponsorship request');

  return prisma.submission.create({
    data: {
      userId,
      listingId,
      link: validatedData.link || '',
      tweet: validatedData.tweet || '',
      otherInfo: validatedData.otherInfo || '',
      eligibilityAnswers: validatedData.eligibilityAnswers || [],
      ask: validatedData.ask || null,
      token: validatedData.token || null,
    },
    include: {
      listing: {
        select: { pocId: true },
      },
    },
  });
}

async function submission(req: NextApiRequestWithUser, res: NextApiResponse) {
  const { userId } = req;
  const {
    listingId,
    link,
    tweet,
    otherInfo,
    eligibilityAnswers,
    ask,
    publicKey,
    token,
  } = req.body;

  logger.debug(`Request body: ${safeStringify(req.body)}`);
  logger.debug(`User: ${safeStringify(userId)}`);

  try {
    const { listing } = await validateSubmissionRequest(
      userId as string,
      listingId,
    );

    const result = await createSubmission(
      userId as string,
      listingId,
      { link, tweet, otherInfo, eligibilityAnswers, ask, publicKey, token },
      listing,
    );

    sendEmailNotification({
      type: 'submissionTalent',
      id: listingId,
      userId: userId as string,
      triggeredBy: userId,
    });

    return res.status(200).json(result);
  } catch (error: any) {
    const statusCode = error.message.includes('Validation') ? 400 : 403;
    logger.error(`User ${userId} unable to submit: ${safeStringify(error)}`);

    return res.status(statusCode).json({
      error: error.message,
      message: `User ${userId} unable to submit: ${error.message}`,
    });
  }
}

export default withAuth(submission);
