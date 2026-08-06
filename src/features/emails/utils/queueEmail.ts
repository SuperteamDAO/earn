import { Queue } from 'bullmq';
import Redis from 'ioredis';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';

type EmailType =
  | 'addPayment'
  | 'announceWinners'
  | 'application'
  | 'commentSponsor'
  | 'commentActivity'
  | 'createListing'
  | 'createHackathon'
  | 'deadlineExtended'
  | 'submissionRejected'
  | 'submissionLike'
  | 'applicationLike'
  | 'powLike'
  | 'submissionSponsor'
  | 'submissionTalent'
  | 'grantApproved'
  | 'grantCompleted'
  | 'grantRejected'
  | 'trancheApproved'
  | 'trancheRejected'
  | 'grantPaymentReceived'
  | 'STWinners'
  | 'nonSTWinners'
  | 'commentReply'
  | 'commentTag'
  | 'scoutInvite'
  | 'spamCredit'
  | 'telegramNewListing';

interface EmailNotificationParams {
  type: EmailType;
  id: string;
  userId?: string;
  otherInfo?: any;
  triggeredBy: any;
  delay?: number;
}

const redis = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
const logicQueue = new Queue('logicQueue', { connection: redis });

async function isBlockedRecipient(userId?: string) {
  if (!userId) {
    return false;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!user?.email) {
    return false;
  }

  const normalizedEmail = user.email.toLowerCase();
  const blockedEmail = await prisma.blockedEmail.findUnique({
    where: { email: normalizedEmail },
    select: { reason: true },
  });

  if (!blockedEmail) {
    return false;
  }

  logger.info(
    `Skipping queued email for blocked recipient: userId=${userId}, email=${normalizedEmail}, reason=${blockedEmail.reason ?? 'unspecified'}`,
  );

  return true;
}

export async function queueEmail({
  type,
  id,
  userId, // pass userId of the person you are sending the email to
  otherInfo,
  triggeredBy,
  delay,
}: EmailNotificationParams): Promise<void> {
  logger.info(
    `Queueing email notification: type=${type}, userId=${userId}, id=${id}, triggeredBy=${triggeredBy}`,
  );

  try {
    if (await isBlockedRecipient(userId)) {
      return;
    }

    const job = await logicQueue.add(
      'processLogic',
      {
        type,
        id,
        userId,
        otherInfo,
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        priority: 1,
        removeOnComplete: true,
        removeOnFail: 500,
        delay,
      },
    );

    logger.info(
      `Email notification queued successfully: jobId=${job.id}, type=${type}, userId=${userId}`,
    );

    return;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error({
      message: `Failed to queue email notification: type=${type}, userId=${userId}, id=${id}`,
      error: errorMessage,
      stack: errorStack,
      metadata: { type, id, userId },
    });

    throw new Error(`Failed to queue email notification: ${errorMessage}`);
  }
}
