import { type User } from '@prisma/client';
import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithUser } from '@/features/auth/types';
import { withAuth } from '@/features/auth/utils/withAuth';
import { submissionSchema } from '@/features/listings/utils/submissionFormSchema';
import { validateSubmissionRequest } from '@/features/listings/utils/validateSubmissionRequest';

async function updateSubmission(
  user: User,
  submissionId: string,
  data: any,
  listing: any,
  isGodMode: boolean,
) {
  const validationResult = submissionSchema(
    listing,
    listing.minRewardAsk || 0,
    listing.maxRewardAsk || 0,
    user as any,
  ).safeParse(data);

  if (!validationResult.success) {
    throw new Error(JSON.stringify(validationResult.error.formErrors));
  }

  const validatedData = validationResult.data;

  if (validatedData.publicKey) {
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        publicKey: validatedData.publicKey,
      },
    });
  }

  const existingSubmission = await prisma.submission.findUnique({
    where: { id: submissionId },
  });

  const isGod = user?.role === 'GOD' && isGodMode;
  if (!existingSubmission) {
    throw new Error('Submission not found');
  }

  const isAllowedToUpdate = existingSubmission.userId === user.id || isGod;

  if (!isAllowedToUpdate) {
    throw new Error('User does not have permission to update this submission');
  }

  if (existingSubmission.label === 'Spam' && !isGod) {
    throw new Error('User submissions has been flagged as spam');
  }

  if (
    listing.type === 'sponsorship' &&
    (existingSubmission.status !== 'Pending' ||
      existingSubmission.label !== 'New') &&
    !isGod
  ) {
    throw new Error('Submission status is not available to edit');
  }

  const formattedData = {
    link: validatedData.link || '',
    tweet: validatedData.tweet || '',
    otherInfo: validatedData.otherInfo || '',
    eligibilityAnswers: validatedData.eligibilityAnswers || [],
    ask: validatedData.ask || 0,
    token: validatedData.token || null,
    otherTokenDetails: validatedData.otherTokenDetails || null,
  };

  return prisma.submission.update({
    where: { id: existingSubmission.id },
    data: formattedData,
  });
}

async function submission(req: NextApiRequestWithUser, res: NextApiResponse) {
  const { userId } = req;
  const { listingId, submissionId, isGodMode, ...submissionData } = req.body;

  logger.debug(`Request body: ${safeStringify(req.body)}`);
  logger.debug(`User: ${safeStringify(userId)}`);

  if (!listingId) {
    return res.status(400).json({
      error: 'Missing required field',
      message: 'Listing ID is required',
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    const { listing } = await validateSubmissionRequest(
      userId as string,
      listingId,
      user?.role === 'GOD' && isGodMode,
    );

    if (!user) {
      return res.status(400).json({
        error: 'User not found',
        message: 'User not found',
      });
    }

    const result = await updateSubmission(
      user,
      submissionId,
      submissionData,
      listing,
      isGodMode,
    );

    return res.status(200).json(result);
  } catch (error: any) {
    logger.error(
      `User ${userId} unable to update submission: ${safeStringify(error)}`,
    );

    let statusCode = 403;
    try {
      JSON.parse(error.message);
      statusCode = 400;
    } catch {}

    return res.status(statusCode).json({
      error: error.message,
      message: `Unable to update submission: ${error.message}`,
    });
  }
}

export default withAuth(submission);
