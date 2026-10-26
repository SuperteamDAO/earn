import { assert, describe, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { TestClock } from 'effect/testing';

import * as Credits from '@/server/credits';
import * as Database from '@/server/database';
import * as GrantAirtable from '@/server/grant-airtable';
import * as GrantPayments from '@/server/grant-payments';
import * as GrantReview from '@/server/grant-review';
import * as GrantSheets from '@/server/grant-sheets';
import * as GrantTranches from '@/server/grant-tranches';
import * as Locks from '@/server/locks';
import * as Queues from '@/server/queues';
import type { SponsorWriter } from '@/server/users';

const NOW = Date.parse('2026-10-26T12:00:00Z');

type Row = Record<string, unknown>;

const SPONSOR: SponsorWriter = {
  userId: 'sponsor-user',
  privyDid: 'did:privy:sponsor',
  sponsorId: 's1',
  role: 'USER',
  god: false,
  hackathonId: null,
};

const grantRow = (overrides: Row = {}): Row => ({
  id: 'g1',
  slug: 'builders',
  title: 'Builder Grants',
  sponsorId: 's1',
  token: 'USDC',
  maxReward: 10_000,
  isPaused: false,
  isNative: true,
  airtableId: 'recGrant',
  status: 'OPEN',
  isPublished: true,
  emailSalutation: null,
  questions: [],
  sponsor: { name: 'Acme' },
  ...overrides,
});

const applicationRow = (id: string, overrides: Row = {}): Row => ({
  id,
  userId: `u-${id}`,
  grantId: 'g1',
  label: 'Unreviewed',
  applicationStatus: 'Pending',
  projectTitle: `Project ${id}`,
  approvedAmount: 0,
  totalPaid: 0,
  totalTranches: 0,
  walletAddress: 'W',
  paymentDetails: null,
  user: { firstName: 'Ada' },
  ...overrides,
});

const setup = ({
  grant = grantRow(),
  applications = [applicationRow('a1')],
  tranches = [] as Array<Row>,
  usedTx = false,
  paymentValid = true,
}: {
  grant?: Row;
  applications?: Array<Row>;
  tranches?: Array<Row>;
  usedTx?: boolean;
  paymentValid?: boolean;
} = {}) => {
  const emails: Array<Queues.EmailJob> = [];
  const synced: Array<string> = [];
  const payments: Array<string> = [];
  const ledger: Array<string> = [];
  const withRelations = (row: Row) => ({ ...row, grant });
  const client = {
    grants: {
      findUnique: async () => grant,
      findFirst: async () => grant,
    },
    user: {
      findUniqueOrThrow: async () => ({
        isKYCVerified: false,
        kycVerifiedAt: null,
      }),
    },
    grantApplication: {
      findMany: async ({ where }: { where: Row }) => {
        const ids =
          where.id && typeof where.id === 'object' && 'in' in where.id
            ? (where.id.in as Array<string>)
            : null;
        return applications
          .filter((row) => !ids || ids.includes(String(row.id)))
          .map(withRelations);
      },
      findUnique: async ({ where }: { where: Row }) => {
        const row = applications.find((each) => each.id === where.id);
        return row ? withRelations(row) : null;
      },
      findUniqueOrThrow: async ({ where }: { where: Row }) => {
        const row = applications.find((each) => each.id === where.id);
        if (!row) throw new Error('missing');
        return withRelations(row);
      },
      update: async ({ where, data }: { where: Row; data: Row }) => {
        const row = applications.find((each) => each.id === where.id);
        if (!row) throw new Error('missing');
        for (const [key, value] of Object.entries(data)) {
          row[key] =
            value && typeof value === 'object' && 'increment' in value
              ? Number(row[key]) + Number(value.increment)
              : value;
        }
        return withRelations(row);
      },
    },
    grantTranche: {
      findUniqueOrThrow: async ({ where }: { where: Row }) => {
        const row = tranches.find((each) => each.id === where.id);
        if (!row) throw new Error('missing');
        return {
          ...row,
          Grant: { ...grant },
          GrantApplication: applications.find(
            (each) => each.id === row.applicationId,
          ),
        };
      },
      findMany: async () => tranches.filter((row) => row.status === 'Approved'),
      count: async () =>
        tranches.filter((row) => row.status !== 'Rejected').length,
      update: async ({ where, data }: { where: Row; data: Row }) => {
        const row = tranches.find((each) => each.id === where.id) ?? {};
        Object.assign(row, data);
        return {
          ...row,
          GrantApplication: {
            ...applications.find((each) => each.id === row.applicationId),
            user: {},
            grant: {},
          },
        };
      },
    },
    $transaction: async (operations: Array<Promise<unknown>>) =>
      Promise.all(operations),
  };
  const layer = GrantReview.layer.pipe(
    Layer.provide(
      Layer.mergeAll(
        Layer.succeed(
          Database.Database,
          Database.Database.of({
            query: (_operation, run) =>
              Effect.promise(() => run(client as never)),
          }),
        ),
        Layer.succeed(
          GrantAirtable.GrantAirtable,
          GrantAirtable.GrantAirtable.of({
            syncApplication: () => Effect.void,
            syncStatuses: (rows) =>
              Effect.sync(() => void synced.push(...rows.map((r) => r.id))),
            addRecipient: () => Effect.succeed(true),
            addPayment: (_row, tranche) =>
              Effect.sync(() => void payments.push(tranche.id)),
          }),
        ),
        Layer.succeed(
          GrantPayments.GrantPayments,
          GrantPayments.GrantPayments.of({
            token: () =>
              Effect.succeed({ tokenSymbol: 'USDC', mintAddress: 'mint' }),
            usdPrice: () => Effect.succeed(1),
            used: () => Effect.succeed(usedTx),
            verify: () =>
              Effect.succeed(
                paymentValid
                  ? { isValid: true }
                  : { isValid: false, error: 'Transaction not found' },
              ),
          }),
        ),
        Layer.succeed(
          GrantSheets.GrantSheets,
          GrantSheets.GrantSheets.of({ create: () => Effect.die('unused') }),
        ),
        Layer.succeed(
          GrantTranches.GrantTranches,
          GrantTranches.GrantTranches.of({
            create: () => Effect.die('unused'),
          }),
        ),
        Layer.succeed(
          Credits.Credits,
          Credits.Credits.of({
            balance: () => Effect.die('unused'),
            consume: () => Effect.die('unused'),
            winBonus: () => Effect.die('unused'),
            grantWinBonus: (userId) =>
              Effect.sync(() => void ledger.push(`bonus:${userId}`)),
            spamPenalty: () => Effect.die('unused'),
            grantSpamPenalty: (userId) =>
              Effect.sync(() => void ledger.push(`penalty:${userId}`)),
            dispute: () => Effect.die('unused'),
            refundListing: () => Effect.die('unused'),
          }),
        ),
        Layer.succeed(
          Queues.Queues,
          Queues.Queues.of({
            email: (job) => Effect.sync(() => void emails.push(job)),
          }),
        ),
        Layer.succeed(
          Locks.Locks,
          Locks.Locks.of({ with: (_key, effect) => effect }),
        ),
      ),
    ),
  );
  const run = <A, E>(
    use: (service: GrantReview.GrantReview['Service']) => Effect.Effect<A, E>,
  ) =>
    Effect.gen(function* () {
      yield* TestClock.setTime(NOW);
      return yield* GrantReview.GrantReview.use(use);
    }).pipe(Effect.provide(layer));
  return { run, applications, tranches, emails, synced, payments, ledger };
};

// The status Earn's route answered with.
const statusOf = <A, E extends { readonly _tag: string }>(
  effect: Effect.Effect<A, E>,
) =>
  effect.pipe(
    Effect.flip,
    Effect.map((error) =>
      error instanceof GrantReview.ReviewRefused ? error.status : error._tag,
    ),
  );

describe('GrantReview.decide', () => {
  it.effect('approves: amounts, tranches, credits, emails and Airtable', () => {
    const { run, applications, emails, synced, ledger } = setup({
      applications: [applicationRow('a1'), applicationRow('a2')],
    });
    return Effect.gen(function* () {
      const result = yield* run((review) =>
        review.decide(SPONSOR, {
          data: [
            { id: 'a1', approvedAmount: 3000 },
            { id: 'a2', approvedAmount: 6000 },
          ],
          applicationStatus: 'Approved',
        }),
      );
      assert.deepStrictEqual(result.applicationIds, ['a1', 'a2']);
      const [first, second] = applications;
      assert.strictEqual(first?.applicationStatus, 'Approved');
      assert.strictEqual(first?.approvedAmountInUSD, 3000);
      assert.strictEqual(first?.totalTranches, 2);
      // Over 5,000: three tranches.
      assert.strictEqual(second?.totalTranches, 3);
      assert.strictEqual(first?.label, 'Reviewed');
      assert.strictEqual(first?.decidedBy, 'sponsor-user');
      assert.deepStrictEqual(ledger, ['bonus:u-a1', 'bonus:u-a2']);
      assert.deepStrictEqual(
        emails.map((job) => job.type),
        ['grantApproved', 'grantApproved'],
      );
      assert.deepStrictEqual(synced, ['a1', 'a2']);
    });
  });

  it.effect('rejects, skipping the cooldown when asked', () => {
    const { run, applications, emails } = setup();
    return Effect.gen(function* () {
      yield* run((review) =>
        review.decide(SPONSOR, {
          data: [{ id: 'a1' }],
          applicationStatus: 'Rejected',
          skipCooldown: true,
          customNote: '<p>Thanks for applying</p>',
        }),
      );
      assert.strictEqual(applications[0]?.applicationStatus, 'Rejected');
      assert.strictEqual(applications[0]?.isCooldownSkipped, true);
      assert.deepStrictEqual(emails[0]?.otherInfo, {
        customEmailNote: '<p>Thanks for applying</p>',
      });
    });
  });

  it.effect('refuses another sponsor’s grant and paused approvals', () => {
    const theirs = setup({ grant: grantRow({ sponsorId: 's2' }) });
    const paused = setup({ grant: grantRow({ isPaused: true }) });
    return Effect.gen(function* () {
      const decision = {
        data: [{ id: 'a1', approvedAmount: 100 }],
        applicationStatus: 'Approved',
      };
      assert.strictEqual(
        yield* statusOf(theirs.run((r) => r.decide(SPONSOR, decision))),
        403,
      );
      assert.strictEqual(
        yield* statusOf(paused.run((r) => r.decide(SPONSOR, decision))),
        409,
      );
    });
  });

  it.effect('refuses unsafe custom notes', () => {
    const { run } = setup();
    return Effect.gen(function* () {
      assert.strictEqual(
        yield* statusOf(
          run((review) =>
            review.decide(SPONSOR, {
              data: [{ id: 'a1' }],
              applicationStatus: 'Rejected',
              customNote: '<script>alert(1)</script><p>hi</p>',
            }),
          ),
        ),
        400,
      );
    });
  });
});

describe('GrantReview.label', () => {
  it.effect('penalizes spam with a credit', () => {
    const { run, applications, ledger } = setup({
      applications: [applicationRow('a1'), applicationRow('a2')],
    });
    return Effect.gen(function* () {
      yield* run((review) =>
        review.label(SPONSOR, { ids: ['a1', 'a2'], label: 'Spam' }),
      );
      assert.strictEqual(applications[1]?.label, 'Spam');
      assert.deepStrictEqual(ledger, ['penalty:u-a1', 'penalty:u-a2']);
      assert.strictEqual(
        yield* statusOf(
          run((review) =>
            review
              .label(SPONSOR, { ids: ['a1', 'a2'], label: 'Reviewed' })
              .pipe(Effect.asVoid),
          ),
        ),
        400,
      );
    });
  });
});

const tranche = (overrides: Row = {}): Row => ({
  id: 't1',
  applicationId: 'a1',
  grantId: 'g1',
  status: 'Pending',
  ask: 500,
  ...overrides,
});

describe('GrantReview.decideTranche', () => {
  const approved = applicationRow('a1', {
    applicationStatus: 'Approved',
    approvedAmount: 1000,
    totalPaid: 500,
    totalTranches: 2,
  });

  it.effect('approves, files the payment and emails the grantee', () => {
    const { run, tranches, payments, emails } = setup({
      applications: [approved],
      tranches: [tranche()],
    });
    return Effect.gen(function* () {
      yield* run((review) =>
        review.decideTranche(SPONSOR, {
          id: 't1',
          status: 'Approved',
          approvedAmount: 500,
        }),
      );
      assert.strictEqual(tranches[0]?.status, 'Approved');
      assert.strictEqual(tranches[0]?.approvedAmount, 500);
      assert.deepStrictEqual(payments, ['t1']);
      assert.deepStrictEqual(
        emails.map((job) => [job.type, job.userId]),
        [['trancheApproved', 'u-a1']],
      );
    });
  });

  it.effect('decides a tranche once, and never above its ask', () => {
    const decided = setup({
      applications: [approved],
      tranches: [tranche({ status: 'Approved' })],
    });
    const over = setup({ applications: [approved], tranches: [tranche()] });
    return Effect.gen(function* () {
      assert.strictEqual(
        yield* statusOf(
          decided.run((r) =>
            r.decideTranche(SPONSOR, { id: 't1', status: 'Rejected' }),
          ),
        ),
        409,
      );
      assert.strictEqual(
        yield* statusOf(
          over.run((r) =>
            r.decideTranche(SPONSOR, {
              id: 't1',
              status: 'Approved',
              approvedAmount: 600,
            }),
          ),
        ),
        400,
      );
    });
  });
});

const pay = (amount: number) => (review: GrantReview.GrantReview['Service']) =>
  review.recordPayment(SPONSOR, {
    id: 'a1',
    trancheAmount: amount,
    txId: 'abc',
  });

describe('GrantReview.recordPayment', () => {
  const approved = applicationRow('a1', {
    applicationStatus: 'Approved',
    approvedAmount: 1000,
    totalPaid: 500,
    totalTranches: 1,
    paymentDetails: [{ txId: 'old', tranche: 1, amount: 500 }],
  });

  it.effect('records a verified payment and completes a paid grant', () => {
    const { run, applications, emails } = setup({ applications: [approved] });
    return Effect.gen(function* () {
      yield* run((review) =>
        review.recordPayment(SPONSOR, {
          id: 'a1',
          trancheAmount: 500,
          txId: 'https://solscan.io/tx/abc',
        }),
      );
      const row = applications[0];
      assert.strictEqual(row?.totalPaid, 1000);
      assert.strictEqual(row?.applicationStatus, 'Completed');
      assert.deepStrictEqual(row?.paymentDetails, [
        { txId: 'old', tranche: 1, amount: 500 },
        { txId: 'https://solscan.io/tx/abc', tranche: 2, amount: 500 },
      ]);
      assert.strictEqual(emails[0]?.type, 'grantPaymentReceived');
    });
  });

  it.effect('refuses reused, unverified or oversized payments', () => {
    const reused = setup({ applications: [approved], usedTx: true });
    const unverified = setup({ applications: [approved], paymentValid: false });
    return Effect.gen(function* () {
      assert.strictEqual(yield* statusOf(reused.run(pay(500))), 400);
      assert.strictEqual(yield* statusOf(unverified.run(pay(500))), 400);
      assert.strictEqual(yield* statusOf(unverified.run(pay(600))), 400);
    });
  });
});

describe('GrantReview.complete', () => {
  it.effect('completes only approved applications', () => {
    const { run, emails } = setup({
      applications: [applicationRow('a1', { applicationStatus: 'Approved' })],
    });
    const pending = setup();
    return Effect.gen(function* () {
      yield* run((review) => review.complete(SPONSOR, 'a1'));
      assert.strictEqual(emails[0]?.type, 'grantCompleted');
      assert.strictEqual(
        yield* statusOf(
          pending.run((review) => review.complete(SPONSOR, 'a1')),
        ),
        400,
      );
    });
  });
});

describe('GrantReview.deleteDraft', () => {
  it.effect('deletes only unpublished drafts', () => {
    const { run } = setup();
    return Effect.gen(function* () {
      assert.strictEqual(
        yield* statusOf(run((review) => review.deleteDraft(SPONSOR, 'g1'))),
        400,
      );
    });
  });
});
