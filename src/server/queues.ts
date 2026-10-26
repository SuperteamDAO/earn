import 'server-only';

import { Queue } from 'bullmq';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Redacted from 'effect/Redacted';
import Redis from 'ioredis';

import * as AppConfig from '@/server/app-config';

// The emails earn-emails sends, by its names for them. It expands each into
// the concrete emails, so a job's shape is a contract with that repo.
export type EmailType =
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
  | 'spamCredit'
  | 'telegramNewListing';

export interface EmailJob {
  readonly type: EmailType;
  // The record the email is about (listing, submission, comment…).
  readonly id: string;
  // Earn's user id of whoever gets it, when it's one person.
  readonly userId?: string;
  readonly otherInfo?: Record<string, unknown>;
  // Milliseconds to wait before sending.
  readonly delay?: number;
}

// Earn's logicQueue on Redis, consumed by earn-emails. Jobs are shaped and
// retried exactly as Earn always added them. Queueing never fails the write
// that asked for it: a job that can't be added is logged, as the write has
// already happened.
export class Queues extends Context.Service<
  Queues,
  { readonly email: (job: EmailJob) => Effect.Effect<void> }
>()('earn/Queues') {}

// Connected on first use, so a server that never queues never dials Redis.
const lazyQueue = (url: Redacted.Redacted | undefined, name: string) => {
  let queue: Queue | null = null;
  return url
    ? () => {
        queue ??= new Queue(name, {
          connection: new Redis(Redacted.value(url), {
            maxRetriesPerRequest: null,
          }),
        });
        return queue;
      }
    : null;
};

const make = Effect.gen(function* () {
  const config = yield* AppConfig.AppConfig;
  const logicQueue = lazyQueue(config.emailQueueUrl, 'logicQueue');

  const email = (job: EmailJob) => {
    const annotate = Effect.annotateLogs({
      queue: 'logicQueue',
      type: job.type,
      id: job.id,
    });
    if (!logicQueue) {
      return Effect.logWarning('Queue not configured; email skipped').pipe(
        annotate,
      );
    }
    return Effect.tryPromise(() =>
      logicQueue().add(
        'processLogic',
        {
          type: job.type,
          id: job.id,
          userId: job.userId,
          otherInfo: job.otherInfo,
        },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          priority: 1,
          removeOnComplete: true,
          removeOnFail: 500,
          delay: job.delay,
        },
      ),
    ).pipe(
      Effect.asVoid,
      // An unreachable Redis waits forever otherwise.
      Effect.timeout('10 seconds'),
      Effect.catch(() => Effect.logError('Queueing an email failed')),
      annotate,
    );
  };

  return Queues.of({ email });
});

export const layer = Layer.effect(Queues, make);
