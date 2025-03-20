import { Queue } from 'bullmq';
import Redis from 'ioredis';

import logger from '@/lib/logger';

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
  | 'scoutInvite';

interface EmailNotificationParams {
  type: EmailType;
  id: string;
  userId?: string;
  otherInfo?: any;
  triggeredBy: any;
}

const redis = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
const logicQueue = new Queue('logicQueue', { connection: redis });

export function sendEmailNotification({
  type,
  id,
  userId, // pass userId of the person you are sending the email to
  otherInfo,
  triggeredBy: _triggeredBy,
}: EmailNotificationParams) {
  try {
    logicQueue
      .add(
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
        },
      )
      .catch((error: unknown) => {
        logger.error(
          `Failed to queue email job for ${type} to ${userId} with ID ${id}: ${error}`,
        );
      });
  } catch (error: unknown) {
    logger.error(
      `Failed to initialize email queue for ${type} to ${userId} with ID ${id}: ${error}`,
    );
  }
}
