import 'server-only';

import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { CreditEventType, SubmissionLabels } from '@/prisma/enums';
import * as Database from '@/server/database';

// Everyone starts each month with this many submissions.
export const MONTHLY_CREDITS = 3;

// The first instant of the month `offset` months from `now`, in UTC: credit
// entries count toward the month they're dated, and Earn dates rewards and
// penalties to the next one.
export const monthStart = (now: number, offset = 0) => {
  const date = new Date(now);
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + offset, 1),
  );
};

// Writes go through a transaction when the caller has one, so a credit is
// spent only with the submission that spends it.
type Client = Pick<Database.Transaction, 'creditLedger'>;

// Earn's monthly submission credits: a ledger of changes on top of
// MONTHLY_CREDITS, each dated to the month it counts for.
export class Credits extends Context.Service<
  Credits,
  {
    // What they have left this month.
    readonly balance: (
      userId: string,
    ) => Effect.Effect<number, Database.DatabaseError>;
    // Spends one on a submission, inside the caller's transaction.
    readonly consume: (
      client: Client,
      userId: string,
      submissionId: string,
    ) => Effect.Effect<void, Database.DatabaseError>;
    readonly winBonus: (
      userId: string,
      submissionId: string,
    ) => Effect.Effect<void, Database.DatabaseError>;
    readonly grantWinBonus: (
      userId: string,
      applicationId: string,
    ) => Effect.Effect<void, Database.DatabaseError>;
    // One fewer next month for a submission marked spam (it must be).
    readonly spamPenalty: (
      submissionId: string,
    ) => Effect.Effect<void, Database.DatabaseError>;
    readonly grantSpamPenalty: (
      userId: string,
      applicationId: string,
    ) => Effect.Effect<void, Database.DatabaseError>;
    // A pending dispute of a spam penalty, for earncognito to decide.
    readonly dispute: (
      userId: string,
      kind: 'submission' | 'application',
      id: string,
    ) => Effect.Effect<void, Database.DatabaseError>;
    // Gives every entrant of a listing their credit back (a listing taken
    // down after people entered).
    readonly refundListing: (
      listingId: string,
    ) => Effect.Effect<void, Database.DatabaseError>;
  }
>()('earn/Credits') {}

const make = Effect.gen(function* () {
  const database = yield* Database.Database;
  const thisMonth = Clock.currentTimeMillis.pipe(
    Effect.map((now) => monthStart(now)),
  );
  const nextMonth = Clock.currentTimeMillis.pipe(
    Effect.map((now) => monthStart(now, 1)),
  );

  const balance = Effect.fn('Credits.balance')(function* (userId: string) {
    const effectiveMonth = yield* thisMonth;
    const sum = yield* database.query('creditBalance', (client) =>
      client.creditLedger.aggregate({
        where: { userId, effectiveMonth },
        _sum: { change: true },
      }),
    );
    return MONTHLY_CREDITS + (sum._sum.change ?? 0);
  });

  const consume = Effect.fn('Credits.consume')(function* (
    client: Client,
    userId: string,
    submissionId: string,
  ) {
    const effectiveMonth = yield* thisMonth;
    yield* Effect.tryPromise({
      try: () =>
        client.creditLedger.create({
          data: {
            userId,
            submissionId,
            type: CreditEventType.SUBMISSION,
            effectiveMonth,
            change: -1,
          },
        }),
      catch: (cause) =>
        new Database.DatabaseError({ operation: 'consumeCredit', cause }),
    });
  });

  const addNextMonth = (
    operation: string,
    data: {
      readonly userId: string;
      readonly type: CreditEventType;
      readonly change: number;
      readonly submissionId?: string;
      readonly applicationId?: string;
      readonly decision?: 'Pending';
    },
  ) =>
    nextMonth.pipe(
      Effect.flatMap((effectiveMonth) =>
        database.query(operation, (client) =>
          client.creditLedger.create({ data: { ...data, effectiveMonth } }),
        ),
      ),
      Effect.asVoid,
    );

  const spamPenalty = Effect.fn('Credits.spamPenalty')(function* (
    submissionId: string,
  ) {
    const submission = yield* database.query('spamSubmission', (client) =>
      client.submission.findFirst({
        where: { id: submissionId, label: SubmissionLabels.Spam },
        select: { id: true, userId: true },
      }),
    );
    if (!submission) return;
    yield* addNextMonth('spamPenalty', {
      userId: submission.userId,
      submissionId: submission.id,
      type: CreditEventType.SPAM_PENALTY,
      change: -1,
    });
  });

  const refundListing = Effect.fn('Credits.refundListing')(function* (
    listingId: string,
  ) {
    const submissions = yield* database.query('listingEntrants', (client) =>
      client.submission.findMany({
        where: { listingId },
        select: { id: true, userId: true },
      }),
    );
    yield* Effect.forEach(
      submissions,
      (submission) =>
        addNextMonth('refundCredit', {
          userId: submission.userId,
          submissionId: submission.id,
          type: CreditEventType.CREDIT_REFUND,
          change: 1,
        }),
      { concurrency: 5, discard: true },
    );
  });

  return Credits.of({
    balance,
    consume,
    winBonus: (userId, submissionId) =>
      addNextMonth('winBonus', {
        userId,
        submissionId,
        type: CreditEventType.WIN_BONUS,
        change: 1,
      }),
    grantWinBonus: (userId, applicationId) =>
      addNextMonth('grantWinBonus', {
        userId,
        applicationId,
        type: CreditEventType.GRANT_WIN_BONUS,
        change: 1,
      }),
    spamPenalty,
    grantSpamPenalty: (userId, applicationId) =>
      addNextMonth('grantSpamPenalty', {
        userId,
        applicationId,
        type: CreditEventType.GRANT_SPAM_PENALTY,
        change: -1,
      }),
    dispute: (userId, kind, id) =>
      addNextMonth(
        'creditDispute',
        kind === 'submission'
          ? {
              userId,
              submissionId: id,
              type: CreditEventType.SPAM_DISPUTE,
              change: 0,
              decision: 'Pending',
            }
          : {
              userId,
              applicationId: id,
              type: CreditEventType.GRANT_SPAM_DISPUTE,
              change: 0,
              decision: 'Pending',
            },
      ),
    refundListing,
  });
});

export const layer = Layer.effect(Credits, make);
