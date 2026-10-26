import { assert, describe, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { TestClock } from 'effect/testing';

import * as Credits from '@/server/credits';
import * as Database from '@/server/database';
import * as ListingSubmissions from '@/server/listing-submissions';
import * as Queues from '@/server/queues';

const NOW = Date.parse('2026-10-20T12:00:00Z');
const DAY = 24 * 60 * 60 * 1000;

const talent = (overrides: Record<string, unknown> = {}) => ({
  isBlocked: false,
  isTalentFilled: true,
  location: 'India',
  locationUpdatedAt: null,
  linkedTwitter: [],
  ...overrides,
});

const bounty = (overrides: Record<string, unknown> = {}) => ({
  id: 'b1',
  type: 'bounty',
  region: 'Global',
  deadline: new Date(NOW + DAY),
  eligibility: [],
  isActive: true,
  isPublished: true,
  ...overrides,
});

interface Options {
  user?: Record<string, unknown> | null;
  listing?: Record<string, unknown> | null;
  // The month's ledger sum: -3 spends every credit.
  ledger?: number;
  existing?: Record<string, unknown> | null;
}

// A stand-in for Prisma: only the calls the service makes.
const fakeDatabase = (options: Options = {}) => {
  const writes: Array<{ call: string; args: unknown }> = [];
  const locks: Array<unknown> = [];
  const record = (call: string, result: unknown) => async (args: unknown) => {
    writes.push({ call, args });
    return result;
  };
  const user = 'user' in options ? options.user : talent();
  const client = {
    $transaction: async (run: (tx: unknown) => Promise<unknown>) => run(client),
    $queryRaw: async (...args: Array<unknown>) => {
      locks.push(args);
      return [];
    },
    user: {
      findUnique: async () => user,
      findUniqueOrThrow: async () => user,
    },
    bounties: {
      findUnique: async () =>
        'listing' in options ? options.listing : bounty(),
    },
    chapter: {
      findMany: async () => [
        {
          id: 'c1',
          name: 'Superteam India',
          region: 'India',
          displayValue: 'India',
          slug: 'india',
          code: 'IN',
          countries: ['India'],
          banner: null,
          icons: null,
          link: null,
          hello: null,
          nationality: null,
        },
      ],
    },
    creditLedger: {
      aggregate: async () => ({ _sum: { change: options.ledger ?? 0 } }),
      create: record('creditLedger.create', {}),
    },
    submission: {
      findFirst: async () => options.existing ?? null,
      create: record('submission.create', { id: 's-new' }),
      update: record('submission.update', { id: 's1' }),
    },
  };
  const emails: Array<Queues.EmailJob> = [];
  const database = Layer.succeed(
    Database.Database,
    Database.Database.of({
      // The fake has only what the service calls.
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      query: (_operation, run) => Effect.promise(() => run(client as never)),
    }),
  );
  const queues = Layer.succeed(
    Queues.Queues,
    Queues.Queues.of({
      email: (job) => Effect.sync(() => void emails.push(job)),
    }),
  );
  const layer = ListingSubmissions.layer.pipe(
    Layer.provide(Credits.layer),
    Layer.provide(Layer.merge(database, queues)),
  );
  return { layer, writes, locks, emails };
};

const input = (
  overrides: Partial<ListingSubmissions.SubmissionInput> = {},
): ListingSubmissions.SubmissionInput => ({
  listingId: 'b1',
  link: 'https://example.com/work',
  tweet: '',
  otherInfo: '<p>notes</p><script>alert(1)</script>',
  eligibilityAnswers: [],
  ...overrides,
});

const run = <A, E>(
  fake: ReturnType<typeof fakeDatabase>,
  use: (
    service: ListingSubmissions.ListingSubmissions['Service'],
  ) => Effect.Effect<A, E>,
) =>
  Effect.gen(function* () {
    yield* TestClock.setTime(NOW);
    return yield* ListingSubmissions.ListingSubmissions.use(use).pipe(
      Effect.provide(fake.layer),
    );
  });

const refusal = (
  fake: ReturnType<typeof fakeDatabase>,
  how: 'create' | 'update' = 'create',
  body = input(),
) =>
  run(fake, (service) => service[how]('u1', body)).pipe(
    Effect.flip,
    Effect.map((error) =>
      error._tag === 'SubmissionRefused' ? error.reason : error._tag,
    ),
  );

describe('ListingSubmissions.create', () => {
  it.effect(
    'saves the submission and its credit in one locked transaction',
    () =>
      Effect.gen(function* () {
        const fake = fakeDatabase();
        const id = yield* run(fake, (service) => service.create('u1', input()));
        assert.strictEqual(id, 's-new');
        assert.lengthOf(fake.locks, 1);
        assert.deepStrictEqual(
          fake.writes.map(({ call }) => call),
          ['submission.create', 'creditLedger.create'],
        );
        const created = fake.writes[0]?.args as {
          data: Record<string, unknown>;
        };
        assert.strictEqual(created.data.link, 'https://example.com/work');
        assert.notInclude(String(created.data.otherInfo), '<script>');
        const credit = fake.writes[1]?.args as {
          data: Record<string, unknown>;
        };
        assert.deepStrictEqual(credit.data, {
          userId: 'u1',
          submissionId: 's-new',
          type: 'SUBMISSION',
          effectiveMonth: Credits.monthStart(NOW),
          change: -1,
        });
        assert.deepStrictEqual(fake.emails, [
          { type: 'submissionTalent', id: 'b1', userId: 'u1' },
        ]);
      }),
  );

  it.effect('spends no credit on a hackathon track', () =>
    Effect.gen(function* () {
      const fake = fakeDatabase({
        listing: bounty({ type: 'hackathon' }),
        ledger: -3,
      });
      yield* run(fake, (service) => service.create('u1', input()));
      assert.deepStrictEqual(
        fake.writes.map(({ call }) => call),
        ['submission.create'],
      );
    }),
  );

  it.effect('refuses as Earn does, writing nothing', () =>
    Effect.gen(function* () {
      const cases: Array<[Options, string]> = [
        [{ user: null }, 'user'],
        [{ user: talent({ isBlocked: true }) }, 'blocked'],
        [{ listing: null }, 'listing'],
        [{ listing: bounty({ isActive: false }) }, 'unavailable'],
        [{ listing: bounty({ isPublished: false }) }, 'unpublished'],
        [{ user: talent({ isTalentFilled: false }) }, 'profile'],
        [{ listing: bounty({ region: 'Germany' }) }, 'region'],
        [
          {
            listing: bounty({ region: 'India' }),
            user: talent({ locationUpdatedAt: new Date(NOW - 2 * DAY) }),
          },
          'cooldown',
        ],
        [{ listing: bounty({ deadline: new Date(NOW - 1) }) }, 'closed'],
        [{ ledger: -3 }, 'credits'],
        [{ existing: { id: 's1' } }, 'exists'],
      ];
      for (const [options, reason] of cases) {
        const fake = fakeDatabase(options);
        assert.strictEqual(yield* refusal(fake), reason);
        assert.deepStrictEqual(fake.writes, []);
        assert.deepStrictEqual(fake.emails, []);
      }
    }),
  );

  it.effect('checks the form’s rules on the server', () =>
    Effect.gen(function* () {
      const questions = [
        { order: 1, question: 'Why you?' },
        { order: 2, question: 'Repo', type: 'link' },
        { order: 3, question: 'Anything?', optional: true },
      ];
      const fake = fakeDatabase({
        listing: bounty({ eligibility: questions }),
      });
      const error = yield* run(fake, (service) =>
        service.create(
          'u1',
          input({
            link: '',
            tweet: 'https://x.com/someone_else/status/123',
            eligibilityAnswers: [
              { question: 'Why you?', answer: ' ' },
              { question: 'Repo', answer: 'not a url' },
            ],
          }),
        ),
      ).pipe(Effect.flip);
      assert.strictEqual(error._tag, 'InvalidSubmission');
      const issues =
        error._tag === 'InvalidSubmission'
          ? error.issues.map((issue) => issue.path.join('.'))
          : [];
      assert.includeMembers(issues, [
        'link',
        'tweet',
        'eligibilityAnswers.0.answer',
        'eligibilityAnswers.1.answer',
      ]);
      assert.notInclude(issues, 'eligibilityAnswers.2.answer');
      assert.deepStrictEqual(fake.writes, []);
    }),
  );

  it.effect('takes X links from accounts the talent verified', () =>
    Effect.gen(function* () {
      const fake = fakeDatabase({
        user: talent({ linkedTwitter: ['adalovelace'] }),
      });
      yield* run(fake, (service) =>
        service.create(
          'u1',
          input({ tweet: 'https://x.com/AdaLovelace/status/123' }),
        ),
      );
      assert.lengthOf(fake.writes, 2);
    }),
  );
});

describe('ListingSubmissions.update', () => {
  it.effect('edits until the deadline, without the location cooldown', () =>
    Effect.gen(function* () {
      const fake = fakeDatabase({
        listing: bounty({ region: 'India' }),
        user: talent({ locationUpdatedAt: new Date(NOW - 2 * DAY) }),
        existing: { id: 's1', status: 'Pending', label: 'Unreviewed' },
      });
      const id = yield* run(fake, (service) =>
        service.update('u1', input({ link: 'https://example.com/v2' })),
      );
      assert.strictEqual(id, 's1');
      assert.deepStrictEqual(
        fake.writes.map(({ call }) => call),
        ['submission.update'],
      );
      // Edits spend no credit and send no email.
      assert.deepStrictEqual(fake.emails, []);
    }),
  );

  it.effect('refuses rejected, spam, missing and closed entries', () =>
    Effect.gen(function* () {
      const cases: Array<[Options, string]> = [
        [{ existing: null }, 'missing'],
        [{ existing: { id: 's1', status: 'Rejected', label: '' } }, 'rejected'],
        [
          { existing: { id: 's1', status: 'Pending', label: 'Spam' } },
          'rejected',
        ],
        [
          {
            existing: { id: 's1', status: 'Pending', label: '' },
            listing: bounty({ deadline: new Date(NOW - 1) }),
          },
          'closed',
        ],
      ];
      for (const [options, reason] of cases) {
        const fake = fakeDatabase(options);
        assert.strictEqual(yield* refusal(fake, 'update'), reason);
        assert.deepStrictEqual(fake.writes, []);
      }
    }),
  );
});
