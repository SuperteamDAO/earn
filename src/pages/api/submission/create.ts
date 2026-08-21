import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { queueAgent } from '@/features/agents/utils/queueAgent';
import { type NextApiRequestWithUser } from '@/features/auth/types';
import { withAuth } from '@/features/auth/utils/withAuth';
import { consumeCredit } from '@/features/credits/utils/allocateCredits';
import { canUserSubmit } from '@/features/credits/utils/canUserSubmit';
import { queueEmail } from '@/features/emails/utils/queueEmail';
import {
  sanitizeGrantApplicationAnswers,
  sanitizeGrantApplicationHtml,
} from '@/features/grants/utils/sanitizeGrantApplicationHtml';
import { submissionSchema } from '@/features/listings/utils/submissionFormSchema';
import { validateSubmissionRequest } from '@/features/listings/utils/validateSubmissionRequest';
import { extractSocialUsername } from '@/features/social/utils/extractUsername';

type PrismaLike = Pick<typeof prisma, 'user' | 'submission'>;

export async function createSubmission(
  userId: string,
  listingId: string,
  data: any,
  listing: any,
  options?: { isAgent?: boolean; agentId?: string; client?: PrismaLike },
) {
  const client = options?.client ?? prisma;

  const user = await client.user.findUniqueOrThrow({
    where: { id: userId },
  });

  const validationResult = submissionSchema(
    listing,
    listing.minRewardAsk || 0,
    listing.maxRewardAsk || 0,
    user as any,
    { isAgent: options?.isAgent },
  ).safeParse(data);

  if (!validationResult.success) {
    throw new Error(JSON.stringify(validationResult.error.formErrors));
  }

  const validatedData = validationResult.data;
  const submissionTelegram =
    listing.type === 'project' ? validatedData.telegram || null : null;

  if (validatedData.telegram && !user.telegram) {
    await client.user.update({
      where: { id: userId },
      data: { telegram: validatedData.telegram },
    });
  }

  const existingSubmission = await client.submission.findFirst({
    where:
      options?.isAgent && options.agentId
        ? { listingId, agentId: options.agentId }
        : { userId, listingId },
  });

  if (existingSubmission) throw new Error('Submission already exists');

  return client.submission.create({
    data: {
      userId,
      agentId: options?.agentId || null,
      listingId,
      link: validatedData.link || '',
      tweet: validatedData.tweet || '',
      otherInfo: sanitizeGrantApplicationHtml(validatedData.otherInfo),
      eligibilityAnswers:
        sanitizeGrantApplicationAnswers(validatedData.eligibilityAnswers) || [],
      ask: validatedData.ask || null,
      telegram: submissionTelegram,
    },
    include: {
      listing: {
        select: { pocId: true },
      },
    },
  });
}

async function submission(req: NextApiRequestWithUser, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { userId } = req;

  if (!userId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'You must be logged in to submit a listing.',
    });
  }

  const {
    listingId,
    link,
    tweet,
    otherInfo,
    eligibilityAnswers,
    ask,
    telegram: telegramUsername,
  } = req.body;
  const telegram = extractSocialUsername('telegram', telegramUsername);

  logger.debug(`Request body: ${safeStringify(req.body)}`);
  logger.debug(`User: ${safeStringify(userId)}`);

  try {
    const { listing, user } = await validateSubmissionRequest(
      userId as string,
      listingId,
    );

    const isHackathon = listing.type === 'hackathon';
    const isPro = listing.isPro;

    if (isPro && !user.isPro) {
      logger.warn(
        `User ${userId} attempted to submit pro listing without pro membership`,
      );
      return res.status(403).json({
        error: 'Pro membership required',
        message: 'You need a Pro membership to submit to this listing.',
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`
        SELECT id FROM \`User\`
        WHERE id = ${userId as string}
        FOR UPDATE
      `;

      if (!isHackathon && !isPro) {
        const hasCredits = await canUserSubmit(userId as string, tx);
        if (!hasCredits) {
          throw new Error('Insufficient credits');
        }
      }

      const submission = await createSubmission(
        userId as string,
        listingId,
        { link, tweet, otherInfo, eligibilityAnswers, ask, telegram },
        listing,
        { client: tx },
      );

      if (!isHackathon && !isPro) {
        await consumeCredit(userId, submission.id, tx);
        logger.info(`Consumed 1 credit from user ${userId} for submission`);
      }

      return submission;
    });

    await queueEmail({
      type: 'submissionTalent',
      id: listingId,
      userId: userId as string,
      triggeredBy: userId,
    });

    try {
      if (listing.type === 'project') {
        await queueAgent({
          type: 'autoReviewProjectApplication',
          id: result.id,
        });
      }
    } catch (err) {
      logger.error(
        `Failed to queue agent job for autoReviewProjectApplication with id ${result.id}`,
      );
      console.log(
        `Failed to queue agent job for autoReviewProjectApplication with id ${result.id}`,
      );
    }

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
