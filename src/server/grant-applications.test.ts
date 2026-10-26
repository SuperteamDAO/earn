import { assert, describe, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { TestClock } from 'effect/testing';

import * as Database from '@/server/database';
import * as GrantAirtable from '@/server/grant-airtable';
import type { ApplicationBody } from '@/server/grant-application-rules';
import * as GrantApplications from '@/server/grant-applications';
import * as GrantPages from '@/server/grant-pages';
import * as GrantTranches from '@/server/grant-tranches';
import * as Kyc from '@/server/kyc';
import * as Locks from '@/server/locks';
import * as Queues from '@/server/queues';

const NOW = Date.parse('2026-10-26T12:00:00Z');
const DAY = 24 * 60 * 60 * 1000;
const WALLET = '11111111111111111111111111111111';
const CLOUDINARY = 'https://res.cloudinary.com/earn/image/upload/a.png';

type Row = Record<string, unknown>;

const grantRow = (overrides: Row = {}): Row => ({
  id: 'g1',
  title: 'Builder Grants',
  slug: 'builders',
  isActive: true,
  isPublished: true,
  isPaused: false,
  region: 'Global',
  minReward: 100,
  maxReward: 5000,
  token: 'USDC',
  questions: [],
  isNative: true,
  airtableId: 'recGrant',
  isST: false,
  ...overrides,
});

const userRow = (overrides: Row = {}): Row => ({
  id: 'u1',
  isBlocked: false,
  isTalentFilled: true,
  location: null,
  locationUpdatedAt: null,
  peopleId: null,
  telegram: null,
  linkedTwitter: ['adalove'],
  people: null,
  isKYCVerified: true,
  ...overrides,
});

const applicationRow = (overrides: Row = {}): Row => ({
  id: 'a1',
  userId: 'u1',
  grantId: 'g1',
  applicationStatus: 'Approved',
  label: 'Reviewed',
  decidedAt: new Date(NOW - 40 * DAY),
  approvedAmount: 1000,
  totalPaid: 0,
  totalTranches: 2,
  walletAddress: WALLET,
  projectTitle: 'Project',
  projectOneLiner: 'One line',
  projectTimeline: '1 December 2026',
  createdAt: new Date(NOW - 50 * DAY),
  GrantTranche: [],
  ...overrides,
});

const body: ApplicationBody = {
  grantId: 'g1',
  projectTitle: 'Project',
  projectOneLiner: 'One line',
  projectDetails: '<p>Details</p>',
  projectTimeline: '2026-12-01',
  proofOfWork: '<p>Proof</p>',
  milestones: '<p>Milestones</p>',
  kpi: '<p>KPI</p>',
  walletAddress: WALLET,
  ask: 1000,
  twitter: 'https://x.com/adalove',
  telegram: 'https://t.me/adalove',
  answers: [],
};

const setup = ({
  grant = grantRow(),
  user = userRow(),
  applications = [] as Array<Row>,
  kyc = 'verified',
}: {
  grant?: Row;
  user?: Row;
  applications?: Array<Row>;
  kyc?: Kyc.Verification;
} = {}) => {
  const tranches: Array<Row> = [];
  const created: Array<Row> = [];
  const userUpdates: Array<Row> = [];
  const emails: Array<Queues.EmailJob> = [];
  const airtable: Array<string> = [];
  const withGrant = (row: Row) => ({
    ...row,
    grant,
    user,
    GrantTranche: tranches.filter((t) => t.applicationId === row.id),
  });
  const client = {
    grants: { findUnique: async () => grant },
    user: {
      findUnique: async () => user,
      update: async ({ data }: { data: Row }) => {
        userUpdates.push(data);
        Object.assign(user, data);
        return user;
      },
    },
    chapter: { findMany: async () => [] },
    grantApplication: {
      findFirst: async ({ where }: { where: Row }) => {
        if ('walletAddress' in where) return null;
        const status = where.applicationStatus;
        const found = applications.find((row) =>
          typeof status === 'string'
            ? row.applicationStatus === status
            : status &&
                typeof status === 'object' &&
                'in' in status &&
                Array.isArray(status.in)
              ? status.in.includes(row.applicationStatus)
              : where.id === undefined || row.id === where.id,
        );
        return found ? withGrant(found) : null;
      },
      findUniqueOrThrow: async ({ where }: { where: Row }) => {
        const found = applications.find((row) => row.id === where.id);
        if (!found) throw new Error('not found');
        return withGrant(found);
      },
      create: async ({ data }: { data: Row }) => {
        created.push(data);
        return { ...data, id: 'new', createdAt: new Date(NOW), user, grant };
      },
      update: async ({ where, data }: { where: Row; data: Row }) => {
        const row = applications.find((each) => each.id === where.id) ?? {};
        Object.assign(row, data);
        return withGrant(row);
      },
    },
    grantTranche: {
      findFirst: async () => null,
      create: async ({ data }: { data: Row }) => {
        const row = { ...data, id: `t${tranches.length + 1}` };
        tranches.push(row);
        return row;
      },
    },
  };
  const database = Layer.succeed(
    Database.Database,
    Database.Database.of({
      query: (_operation, run) => Effect.promise(() => run(client as never)),
    }),
  );
  const fakeAirtable = Layer.succeed(
    GrantAirtable.GrantAirtable,
    GrantAirtable.GrantAirtable.of({
      syncApplication: (row) =>
        Effect.sync(() => void airtable.push(`sync:${row.id}`)),
      syncStatuses: () => Effect.void,
      addRecipient: (row) =>
        Effect.sync(() => {
          airtable.push(`recipient:${row.id}`);
          return true;
        }),
      addPayment: (_row, tranche) =>
        Effect.sync(() => void airtable.push(`payment:${tranche.id}`)),
    }),
  );
  const layer = GrantApplications.layer.pipe(
    Layer.provide(GrantTranches.layer),
    Layer.provide(GrantPages.layer),
    Layer.provide(
      Layer.mergeAll(
        database,
        fakeAirtable,
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
        Layer.succeed(
          Kyc.Kyc,
          Kyc.Kyc.of({
            accessToken: () => Effect.succeed('token'),
            applicant: () =>
              Effect.succeed({
                id: 'applicant',
                fullName: 'Ada Lovelace',
                country: 'GBR',
                dob: '1815-12-10',
                idNumber: 'X1',
                idType: 'PASSPORT',
              }),
            verification: () => Effect.succeed(kyc),
          }),
        ),
      ),
    ),
  );
  const run = <A, E>(
    use: (
      service: GrantApplications.GrantApplications['Service'],
    ) => Effect.Effect<A, E>,
  ) =>
    Effect.gen(function* () {
      yield* TestClock.setTime(NOW);
      return yield* GrantApplications.GrantApplications.use(use);
    }).pipe(Effect.provide(layer));
  return { run, created, tranches, emails, airtable, userUpdates };
};

const reasonOf = <
  A,
  E extends { readonly reason?: string; readonly _tag: string },
>(
  effect: Effect.Effect<A, E>,
) =>
  effect.pipe(
    Effect.flip,
    Effect.map((error) => error.reason ?? error._tag),
  );

describe('GrantApplications.create', () => {
  it.effect('stores the application, emails it and syncs Airtable', () => {
    const { run, created, emails, airtable, userUpdates } = setup();
    return Effect.gen(function* () {
      yield* run((service) => service.create('u1', body));
      assert.strictEqual(created.length, 1);
      assert.strictEqual(created[0]?.twitter, 'https://x.com/adalove');
      assert.strictEqual(created[0]?.projectTimeline, '1 December 2026');
      assert.strictEqual(created[0]?.ask, 1000);
      assert.deepStrictEqual(
        emails.map((job) => [job.type, job.userId]),
        [['application', 'u1']],
      );
      assert.deepStrictEqual(airtable, ['sync:new']);
      // Their first Telegram handle is kept on the account.
      assert.strictEqual(userUpdates[0]?.telegram, 'https://t.me/adalove');
    });
  });

  it.effect('keeps event grants for Superteam members', () => {
    const { run, created } = setup({ grant: grantRow({ isST: true }) });
    return Effect.gen(function* () {
      const reason = yield* reasonOf(
        run((service) => service.create('u1', body)),
      );
      assert.strictEqual(reason, 'member');
      assert.strictEqual(created.length, 0);
    });
  });

  it.effect('refuses a second application while one is pending', () => {
    const { run } = setup({
      applications: [applicationRow({ applicationStatus: 'Pending' })],
    });
    return Effect.gen(function* () {
      assert.strictEqual(
        yield* reasonOf(run((service) => service.create('u1', body))),
        'exists',
      );
    });
  });

  it.effect('makes a rejected applicant wait 30 days', () => {
    const { run } = setup({
      applications: [
        applicationRow({
          applicationStatus: 'Rejected',
          decidedAt: new Date(NOW - 10 * DAY),
        }),
      ],
    });
    return Effect.gen(function* () {
      assert.strictEqual(
        yield* reasonOf(run((service) => service.create('u1', body))),
        'cooldown',
      );
    });
  });

  it.effect('refuses unverified X accounts and paused grants', () => {
    const unverified = setup({ user: userRow({ linkedTwitter: [] }) });
    const paused = setup({ grant: grantRow({ isPaused: true }) });
    return Effect.gen(function* () {
      assert.strictEqual(
        yield* reasonOf(
          unverified.run((service) => service.create('u1', body)),
        ),
        'invalid',
      );
      assert.strictEqual(
        yield* reasonOf(paused.run((service) => service.create('u1', body))),
        'ineligible',
      );
    });
  });
});

describe('GrantApplications.update', () => {
  it.effect('only edits a pending application not marked spam', () => {
    const { run } = setup({
      applications: [
        applicationRow({ applicationStatus: 'Pending', label: 'Spam' }),
      ],
    });
    return Effect.gen(function* () {
      assert.strictEqual(
        yield* reasonOf(run((service) => service.update('u1', body))),
        'ineligible',
      );
    });
  });
});

describe('GrantApplications.kycVerify', () => {
  it.effect('records the KYC and approves the first tranche', () => {
    const { run, tranches, airtable, userUpdates } = setup({
      user: userRow({ isKYCVerified: false }),
      applications: [applicationRow()],
    });
    return Effect.gen(function* () {
      const result = yield* run((service) => service.kycVerify('u1', 'a1'));
      assert.strictEqual(result, 'verified');
      assert.strictEqual(userUpdates[0]?.kycName, 'Ada Lovelace');
      assert.strictEqual(userUpdates[0]?.isKYCVerified, true);
      assert.strictEqual(tranches.length, 1);
      assert.strictEqual(tranches[0]?.status, 'Approved');
      // Half up front for two tranches.
      assert.strictEqual(tranches[0]?.ask, 500);
      assert.deepStrictEqual(airtable, ['recipient:a1', 'payment:t1']);
    });
  });

  it.effect('is not for grants the foundation doesn’t pay', () => {
    const { run, tranches } = setup({
      grant: grantRow({ airtableId: null }),
      applications: [applicationRow()],
    });
    return Effect.gen(function* () {
      const result = yield* run((service) => service.kycVerify('u1', 'a1'));
      assert.deepStrictEqual(result, { message: 'Not allowed' });
      assert.strictEqual(tranches.length, 0);
    });
  });
});

describe('GrantApplications.requestTranche', () => {
  const request = {
    applicationId: 'a1',
    walletAddress: WALLET,
    projectUpdate: '<p>Done</p>',
  };

  it.effect('asks for the rest once the first tranche is paid', () => {
    const { run, tranches } = setup({
      applications: [applicationRow({ totalPaid: 500 })],
    });
    tranches.push({ id: 't0', applicationId: 'a1', status: 'Paid' });
    return Effect.gen(function* () {
      yield* run((service) => service.requestTranche('u1', request));
      const asked = tranches[1];
      assert.strictEqual(asked?.status, 'Pending');
      assert.strictEqual(asked?.ask, 500);
      assert.strictEqual(asked?.trancheNumber, 2);
    });
  });

  it.effect('refuses someone else’s application', () => {
    const { run } = setup({ applications: [applicationRow()] });
    return Effect.gen(function* () {
      assert.strictEqual(
        yield* reasonOf(
          run((service) => service.requestTranche('u2', request)),
        ),
        'unauthorized',
      );
    });
  });

  it.effect('waits for the previous tranche to be paid', () => {
    const { run, tranches } = setup({ applications: [applicationRow()] });
    tranches.push({ id: 't0', applicationId: 'a1', status: 'Approved' });
    return Effect.gen(function* () {
      assert.strictEqual(
        yield* reasonOf(
          run((service) => service.requestTranche('u1', request)),
        ),
        'invalid',
      );
    });
  });

  it.effect('needs an event grant’s photos and receipts', () => {
    const { run, tranches } = setup({
      grant: grantRow({ isST: true }),
      applications: [applicationRow({ totalPaid: 500 })],
    });
    tranches.push({ id: 't0', applicationId: 'a1', status: 'Paid' });
    return Effect.gen(function* () {
      assert.strictEqual(
        yield* reasonOf(
          run((service) => service.requestTranche('u1', request)),
        ),
        'invalid',
      );
      yield* run((service) =>
        service.requestTranche('u1', {
          ...request,
          eventPictures: [CLOUDINARY],
          eventReceipts: [CLOUDINARY],
          attendeeCount: 40,
          socialPost: 'x.com/ada/status/1',
        }),
      );
      assert.strictEqual(tranches[1]?.attendeeCount, 40);
      assert.strictEqual(tranches[1]?.socialPost, 'https://x.com/ada/status/1');
    });
  });
});

const split = (totalTranches: number, existing: number, first = false) =>
  GrantTranches.trancheAmount({
    totalTranches,
    approvedAmount: 10_000,
    remaining: 7_000,
    existing,
    first,
  });

describe('trancheAmount', () => {
  it('splits as Earn does', () => {
    assert.strictEqual(split(2, 0, true), 3_500);
    assert.strictEqual(split(2, 1), 7_000);
    assert.strictEqual(split(3, 0, true), 3_000);
    assert.strictEqual(split(3, 1), 3_000);
    assert.strictEqual(split(3, 2), 7_000);
    assert.strictEqual(split(4, 3), 7_000);
  });
});
