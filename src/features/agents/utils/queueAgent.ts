import { Queue } from 'bullmq';
import Redis from 'ioredis';

import logger from '@/lib/logger';

export type AgentActionType =
  | 'autoReviewGrantApplication'
  | 'generateContextProject'
  | 'autoReviewProjectApplication';

interface AgentNotificationParams {
  type: AgentActionType;
  id: string;
  userId?: string;
  otherInfo?: any;
}

const redis = new Redis(process.env.AGENT_REDIS_URL!, {
  maxRetriesPerRequest: null,
});
const logicQueue = new Queue('agentLogicQueue', { connection: redis });

export async function queueAgent({
  type,
  id,
  userId,
  otherInfo,
}: AgentNotificationParams): Promise<void> {
  try {
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
      },
    );

    console.log(
      `Agent notification queued successfully: jobId=${job.id}, type=${type}, id=${id}`,
    );
    logger.info(
      `Agent notification queued successfully: jobId=${job.id}, type=${type}, id=${id}`,
    );

    return;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error({
      message: `Failed to queue agent job : type=${type}, id=${id}`,
      error: errorMessage,
      stack: errorStack,
      metadata: { type, id },
    });

    throw new Error(`Failed to queue agent job: ${errorMessage}`);
  }
}
