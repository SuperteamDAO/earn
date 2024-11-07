import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { isDeadlineOver, submissionSchema } from '@/features/listings';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;
  const {
    listingId,
    applicationLink,
    tweet,
    otherInfo,
    eligibilityAnswers,
    ask,
  } = req.body;

  logger.debug(`Request body: ${safeStringify(req.body)}`);
  logger.debug(`User: ${safeStringify(req.userId)}`);

  if (!listingId) {
    return res.status(400).json({
      message: 'Listing ID is required.',
    });
  }

  try {
    const listing = await prisma.bounties.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      return res.status(404).json({
        message: 'Listing not found',
      });
    }

    const hasDeadlinePassed = isDeadlineOver(listing?.deadline || '');

    if (hasDeadlinePassed) {
      return res.status(400).json({
        message: 'Submissions closed',
      });
    }

    const submission = await prisma.submission.findFirst({
      where: {
        userId,
        listingId,
      },
    });

    if (!submission) {
      return res.status(404).json({
        message: 'Submission not found.',
      });
    }

    try {
      const validatedData = submissionSchema(
        listing as any,
        listing.minRewardAsk || 0,
        listing.maxRewardAsk || 0,
      ).parse({
        applicationLink,
        tweet,
        otherInfo,
        ask,
        eligibilityAnswers,
      });

      const result = await prisma.submission.update({
        where: {
          id: submission.id,
        },
        data: {
          link: validatedData.applicationLink || '',
          tweet: validatedData.tweet || '',
          otherInfo: validatedData.otherInfo || '',
          eligibilityAnswers: validatedData.eligibilityAnswers || undefined,
          ask: validatedData.ask || 0,
        },
      });

      return res.status(200).json(result);
    } catch (validationError: any) {
      if (validationError.errors) {
        return res.status(400).json({
          message: 'Validation error',
          errors: validationError.errors,
        });
      }
      throw validationError;
    }
  } catch (error: any) {
    logger.error(
      `User ${userId} unable to edit submission: ${safeStringify(error)}`,
    );
    return res.status(400).json({
      error: error.message,
      message: `User ${userId} unable to edit submission, ${error.message}`,
    });
  }
}

export default withAuth(handler);
