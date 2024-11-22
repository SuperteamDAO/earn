import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import {
  submissionSchema,
  validateSubmissionRequest,
} from '@/features/listings';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

async function updateSubmission(
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

  const existingSubmission = await prisma.submission.findFirst({
    where: { userId, listingId },
  });

  if (!existingSubmission) {
    throw new Error('Submission not found');
  }

  const formattedData = {
    link: validatedData.link || '',
    tweet: validatedData.tweet || '',
    otherInfo: validatedData.otherInfo || '',
    eligibilityAnswers: validatedData.eligibilityAnswers || [],
    ask: validatedData.ask || 0,
  };

  return prisma.submission.update({
    where: { id: existingSubmission.id },
    data: formattedData,
  });
}

async function submission(req: NextApiRequestWithUser, res: NextApiResponse) {
  const { userId } = req;
  const { listingId, ...submissionData } = req.body;

  logger.debug(`Request body: ${safeStringify(req.body)}`);
  logger.debug(`User: ${safeStringify(userId)}`);

  if (!listingId) {
    return res.status(400).json({
      error: 'Missing required field',
      message: 'Listing ID is required',
    });
  }

  try {
    const { listing } = await validateSubmissionRequest(
      userId as string,
      listingId,
    );

    const result = await updateSubmission(
      userId as string,
      listingId,
      submissionData,
      listing,
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
