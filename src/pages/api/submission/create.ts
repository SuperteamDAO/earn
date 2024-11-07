import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { sendEmailNotification } from '@/features/emails';
import { isDeadlineOver, submissionSchema } from '@/features/listings';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

async function submission(req: NextApiRequestWithUser, res: NextApiResponse) {
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

      const existingSubmission = await prisma.submission.findFirst({
        where: {
          userId,
          listingId,
        },
      });

      if (existingSubmission) {
        return res.status(400).json({
          message: 'Submission already exists for this user and listing.',
        });
      }

      const result = await prisma.submission.create({
        data: {
          userId: userId as string,
          listingId,
          link: validatedData.applicationLink || '',
          tweet: validatedData.tweet || '',
          otherInfo: validatedData.otherInfo || '',
          eligibilityAnswers: validatedData.eligibilityAnswers || undefined,
          ask: validatedData.ask || null,
        },
        include: {
          listing: {
            select: {
              pocId: true,
            },
          },
        },
      });

      sendEmailNotification({
        type: 'submissionTalent',
        id: listingId,
        userId: userId as string,
        triggeredBy: userId,
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
    logger.error(`User ${userId} unable to submit: ${safeStringify(error)}`);
    return res.status(400).json({
      error: error.message,
      message: `User ${userId} unable to submit, ${error.message}`,
    });
  }
}

export default withAuth(submission);
