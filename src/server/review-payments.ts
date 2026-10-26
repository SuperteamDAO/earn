import 'server-only';

import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { Prisma } from '@/prisma/client';
import * as Database from '@/server/database';
import * as Queues from '@/server/queues';
import {
  type ListingNotFound,
  type NotYourListing,
  ownedListing,
  paymentsOf,
  ReviewInvalid,
  SubmissionsNotFound,
} from '@/server/review';
import * as ReviewChain from '@/server/review-chain';
import type * as Users from '@/server/users';

import {
  normalizeTxId,
  type ReviewPayment,
  rewardsOf,
} from '@/features/sponsor-dashboard/utils/review-rules';

export interface PaymentLink {
  readonly submissionId: string;
  readonly isVerified: boolean;
  readonly txId: string;
  readonly link?: string | undefined;
}

export interface VerifyResult {
  readonly submissionId: string;
  readonly txId: string;
  readonly status: 'SUCCESS' | 'FAIL' | 'ALREADY_VERIFIED';
  readonly message?: string;
  readonly actualAmount?: number;
}

type PaymentErrors =
  | ReviewInvalid
  | SubmissionsNotFound
  | ListingNotFound
  | NotYourListing
  | Database.DatabaseError;

// Recording winners' payments: one the sponsor just sent from their own
// wallet, or ones they paid elsewhere, each checked on-chain first (Earn's
// add-payment and verify-external-payment).
export class ReviewPayments extends Context.Service<
  ReviewPayments,
  {
    readonly addPayment: (
      writer: Users.SponsorWriter,
      id: string,
      paymentDetails: ReadonlyArray<ReviewPayment>,
    ) => Effect.Effect<
      {
        readonly id: string;
        readonly isPaid: boolean;
        readonly paymentDetails: ReadonlyArray<ReviewPayment>;
      },
      PaymentErrors
    >;
    readonly verifyExternal: (
      writer: Users.SponsorWriter,
      listingId: string,
      links: ReadonlyArray<PaymentLink>,
    ) => Effect.Effect<ReadonlyArray<VerifyResult>, PaymentErrors>;
  }
>()('earn/ReviewPayments') {}

// Earn checks this many signatures at once at most.
const MAX_REPLAY_CHECK = 25;

const escapeLike = (value: string) => value.replace(/[\\%_]/g, '\\$&');

// Earn's paymentReplayCheck: the payment details of any submission or grant
// application already naming the signature, bare or in an explorer link.
const existsSql = (table: 'Submission' | 'GrantApplication', txId: string) => {
  const escaped = escapeLike(txId);
  const patterns = [
    escaped,
    `%/tx/${escaped}`,
    `%/tx/${escaped}?%`,
    `%/tx/${escaped}#%`,
    `%/tx/${escaped}/%`,
  ];
  return Prisma.sql`EXISTS (
    SELECT 1 FROM ${Prisma.raw(`\`${table}\``)}
    WHERE paymentDetails IS NOT NULL
      AND (${Prisma.join(
        patterns.map(
          (pattern) =>
            Prisma.sql`JSON_SEARCH(JSON_EXTRACT(paymentDetails, '$[*].txId'), 'one', ${pattern}) IS NOT NULL`,
        ),
        ' OR ',
      )})
    LIMIT 1
  )`;
};
const usedSql = (txIds: ReadonlyArray<string>) => {
  return Prisma.join(
    txIds.map(
      (txId) =>
        Prisma.sql`SELECT ${txId} AS txId WHERE ${existsSql('Submission', txId)} OR ${existsSql('GrantApplication', txId)}`,
    ),
    ' UNION ALL ',
  );
};

const duplicates = (txIds: ReadonlyArray<string>) => [
  ...new Set(txIds.filter((txId, index) => txIds.indexOf(txId) !== index)),
];

const make = Effect.gen(function* () {
  const database = yield* Database.Database;
  const queues = yield* Queues.Queues;
  const chain = yield* ReviewChain.ReviewChain;

  const usedTxIds = (txIds: ReadonlyArray<string>) =>
    Effect.gen(function* () {
      const unique = [...new Set(txIds.filter(Boolean).map(normalizeTxId))];
      if (unique.length === 0) return [];
      if (unique.length > MAX_REPLAY_CHECK) {
        return yield* new ReviewInvalid({
          reason: `Cannot check more than ${MAX_REPLAY_CHECK} transaction IDs at once`,
        });
      }
      const rows = yield* database.query('usedTxIds', (client) =>
        client.$queryRaw<Array<{ txId: string }>>(usedSql(unique)),
      );
      return [...new Set(rows.map((row) => row.txId))];
    });

  const tokenAndPrice = (symbol: string | null) =>
    Effect.gen(function* () {
      const token = yield* chain.token(symbol);
      if (!token) {
        return yield* new ReviewInvalid({
          reason: "Token doesn't exist for this listing",
        });
      }
      const price = yield* chain.price(token.mintAddress);
      return { token, price };
    });

  const addPayment = Effect.fn('ReviewPayments.addPayment')(function* (
    writer: Users.SponsorWriter,
    id: string,
    paymentDetails: ReadonlyArray<ReviewPayment>,
  ) {
    const submission = yield* database.query('paymentSubmission', (client) =>
      client.submission.findUnique({
        where: { id },
        select: {
          listingId: true,
          winnerPosition: true,
          user: { select: { walletAddress: true } },
        },
      }),
    );
    if (!submission) return yield* new SubmissionsNotFound({ ids: [id] });
    const listing = yield* ownedListing(
      database,
      writer.sponsorId,
      submission.listingId,
    );
    const txIds = paymentDetails.map((payment) => normalizeTxId(payment.txId));
    const repeated = duplicates(txIds);
    if (repeated.length > 0) {
      return yield* new ReviewInvalid({
        reason: `Duplicate transaction IDs found: ${repeated.join(', ')}`,
      });
    }
    const used = yield* usedTxIds(txIds);
    if (used.length > 0) {
      return yield* new ReviewInvalid({
        reason: `Transaction IDs already used: ${used.join(', ')}`,
      });
    }
    const payment = paymentDetails[0];
    if (!payment || paymentDetails.length > 1 || payment.tranche !== 1) {
      return yield* new ReviewInvalid({
        reason: 'Bounties only support single payment with tranche 1',
      });
    }
    if (!submission.winnerPosition) {
      return yield* new ReviewInvalid({
        reason: 'Submission has no winner position',
      });
    }
    const reward = rewardsOf(listing.rewards)[
      String(submission.winnerPosition)
    ];
    if (!reward) {
      return yield* new ReviewInvalid({
        reason: 'Winner position has no reward',
      });
    }
    const { token, price } = yield* tokenAndPrice(listing.token);
    const tx = yield* chain
      .transaction(payment.txId)
      .pipe(Effect.orElseSucceed(() => 'unreachable' as const));
    const verdict =
      tx === 'unreachable'
        ? ({
            isValid: false,
            error: "Couldn't fetch transaction details",
          } as const)
        : ReviewChain.checkPayment(tx, {
            recipient: submission.user.walletAddress ?? '',
            expectedAmount: payment.amount,
            token,
            tokenPriceUSD: price,
          });
    if (!verdict.isValid) {
      return yield* new ReviewInvalid({
        reason: `Transaction validation failed: ${verdict.error}`,
      });
    }
    const total = paymentDetails.reduce((sum, each) => sum + each.amount, 0);
    const updated = yield* database.query('addPayment', (client) =>
      client.submission.update({
        where: { id },
        data: {
          isPaid: total >= reward,
          paymentDetails: paymentDetails.map((each) => ({ ...each })),
        },
        select: { id: true, isPaid: true, paymentDetails: true },
      }),
    );
    yield* queues.email({ type: 'addPayment', id });
    return {
      id: updated.id,
      isPaid: updated.isPaid,
      paymentDetails: paymentsOf(updated.paymentDetails),
    };
  });

  const verifyExternal = Effect.fn('ReviewPayments.verifyExternal')(function* (
    writer: Users.SponsorWriter,
    listingId: string,
    allLinks: ReadonlyArray<PaymentLink>,
  ) {
    const links = allLinks.filter((link) => !!link.link);
    const listing = yield* ownedListing(database, writer.sponsorId, listingId);
    const submissions = yield* database.query('unpaidWinners', (client) =>
      client.submission.findMany({
        where: {
          id: { in: links.map((link) => link.submissionId) },
          listingId,
          isPaid: false,
        },
        select: {
          id: true,
          paymentDetails: true,
          winnerPosition: true,
          user: { select: { walletAddress: true } },
        },
      }),
    );
    if (!listing.isWinnersAnnounced) {
      return yield* new ReviewInvalid({ reason: 'Listing not announced' });
    }
    const { token, price } = yield* tokenAndPrice(listing.token);
    const txIds = links
      .map((link) => link.txId)
      .filter(Boolean)
      .map(normalizeTxId);
    const repeated = txIds.filter(
      (txId, index) => txIds.indexOf(txId) !== index,
    );
    if (repeated.length > 0) {
      return yield* new ReviewInvalid({
        reason: `Duplicate transaction IDs found: ${repeated.join(', ')}`,
      });
    }
    if (txIds.length === 0) {
      return yield* new ReviewInvalid({
        reason: 'No valid transaction IDs provided',
      });
    }
    const used = yield* usedTxIds(txIds);
    if (used.length > 0) {
      return yield* new ReviewInvalid({
        reason: `Transaction IDs already used: ${used.join(', ')}`,
      });
    }
    const rewards = rewardsOf(listing.rewards);

    const verify = (link: PaymentLink) =>
      Effect.gen(function* () {
        if (link.isVerified) {
          return {
            submissionId: link.submissionId,
            txId: link.txId,
            status: 'ALREADY_VERIFIED',
            message: 'Already Verified',
          } satisfies VerifyResult;
        }
        const failed = {
          submissionId: link.submissionId,
          txId: link.txId,
          status: 'FAIL',
          message: 'Payment verification failed',
        } satisfies VerifyResult;
        const submission = submissions.find(
          (each) => each.id === link.submissionId,
        );
        if (!link.txId || !submission?.winnerPosition) return failed;
        const reward = rewards[String(submission.winnerPosition)];
        if (!reward) return failed;
        const paid = paymentsOf(submission.paymentDetails).reduce(
          (sum, payment) => sum + payment.amount,
          0,
        );
        if (reward - paid <= 0) return failed;
        const tx = yield* chain
          .transaction(link.txId)
          .pipe(Effect.orElseSucceed(() => null));
        const verdict = ReviewChain.checkPayment(tx, {
          recipient: submission.user.walletAddress ?? '',
          expectedAmount: reward,
          token,
          tokenPriceUSD: price,
        });
        if (!verdict.isValid) {
          yield* Effect.logWarning('External payment not verified').pipe(
            Effect.annotateLogs({
              submissionId: link.submissionId,
              reason: verdict.error,
            }),
          );
          return failed;
        }
        return {
          submissionId: link.submissionId,
          txId: link.txId,
          status: 'SUCCESS',
          // Earn records the prize, not what the transfer came to.
          actualAmount: reward,
        } satisfies VerifyResult;
      });

    // One at a time, five seconds apart, as Earn spares the RPC.
    const results: Array<VerifyResult> = yield* Effect.forEach(links, (link) =>
      verify(link).pipe(
        Effect.tap((result) =>
          result.status === 'ALREADY_VERIFIED'
            ? Effect.void
            : Effect.sleep('5 seconds'),
        ),
      ),
    );

    for (const submission of submissions) {
      const added = results
        .filter(
          (result) =>
            result.status === 'SUCCESS' &&
            result.submissionId === submission.id &&
            (result.actualAmount ?? 0) > 0,
        )
        .map((result) => ({
          txId: result.txId,
          amount: result.actualAmount ?? 0,
          tranche: 1,
        }));
      if (added.length === 0) continue;
      const all = [...paymentsOf(submission.paymentDetails), ...added];
      const reward = rewards[String(submission.winnerPosition)] ?? 0;
      const total = all.reduce((sum, payment) => sum + payment.amount, 0);
      yield* database.query('recordExternalPayment', (client) =>
        client.submission.update({
          where: { id: submission.id },
          data: {
            isPaid: total >= reward,
            paymentDetails: all.map((payment) => ({ ...payment })),
          },
        }),
      );
    }
    return results;
  });

  return ReviewPayments.of({ addPayment, verifyExternal });
});

export const layer = Layer.effect(ReviewPayments, make);
