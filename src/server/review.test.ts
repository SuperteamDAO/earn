import { assert, describe, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Fiber from 'effect/Fiber';
import * as Layer from 'effect/Layer';
import { TestClock } from 'effect/testing';

import * as Credits from '@/server/credits';
import * as Database from '@/server/database';
import * as Earncognito from '@/server/earncognito';
import * as Locks from '@/server/locks';
import * as Queues from '@/server/queues';
import * as Review from '@/server/review';
import * as ReviewAirtable from '@/server/review-airtable';
import * as ReviewAnnounce from '@/server/review-announce';
import * as ReviewBackground from '@/server/review-background';
import * as ReviewChain from '@/server/review-chain';
import * as ReviewPayments from '@/server/review-payments';
import type * as Users from '@/server/users';

const NOW = Date.parse('2026-10-26T12:00:00Z');

type Row = Record<string, unknown>;

// Enough of Prisma's `where` for the services' queries: values, `in`,
// `notIn` and `not`. Relation filters are left to the tests' data.
const matches = (row: Row, where: Row = {}): boolean =>
  Object.entries(where).every(([key, condition]) => {
    if (key === 'listing' || key === 'user' || key === 'OR') return true;
    const value = row[key];
    if (
      condition &&
      typeof condition === 'object' &&
      !(condition instanceof Date)
    ) {
      const filter = condition as {
        in?: Array<unknown>;
        notIn?: Array<unknown>;
        not?: unknown;
      };
      if (filter.in) return filter.in.includes(value);
      if (filter.notIn) return !filter.notIn.includes(value);
      if ('not' in filter) return value !== filter.not;
      return true;
    }
    return value === condition;
  });

const user = (id: string) => ({
  id,
  firstName: id,
  lastName: 'Doe',
  username: `user-${id}`,
  email: `${id}@example.com`,
  photo: null,
  walletAddress: `wallet-${id}`,
  twitter: null,
  discord: null,
  telegram: null,
  website: null,
  isKYCVerified: false,
  kycVerifiedAt: null,
  Submission: [],
  GrantApplication: [],
});

const submission = (id: string, overrides: Row = {}): Row => ({
  id,
  listingId: 'b1',
  userId: `u-${id}`,
  status: 'Pending',
  label: 'Unreviewed',
  link: null,
  tweet: null,
  otherInfo: null,
  eligibilityAnswers: [],
  isWinner: false,
  winnerPosition: null,
  isPaid: false,
  paymentDetails: null,
  notes: null,
  isActive: true,
  isArchived: false,
  createdAt: new Date('2026-10-01'),
  user: user(`u-${id}`),
  ...overrides,
});

interface Options {
  readonly bounty?: Row;
  readonly submissions?: Array<Row>;
  readonly account?: Row | null;
  readonly usedTxIds?: Array<string>;
}

const fakeDatabase = (options: Options = {}) => {
  const bounty: Row = {
    id: 'b1',
    slug: 'logo',
    title: 'Logo',
    type: 'bounty',
    status: 'OPEN',
    isPublished: true,
    isActive: true,
    isWinnersAnnounced: false,
    winnersAnnouncedAt: null,
    deadline: new Date('2026-10-20'),
    publishedAt: new Date('2026-10-01'),
    token: 'USDC',
    rewards: { '1': 500, '2': 300, '99': 50 },
    maxBonusSpots: 2,
    rewardAmount: 900,
    usdValue: 900,
    tokenUsdAtPublish: 1,
    isFndnPaying: false,
    sponsorId: 's1',
    Hackathon: null,
    ...options.bounty,
  };
  const submissions = options.submissions ?? [];
  const comments: Array<Row> = [];
  const userUpdates: Array<Row> = [];
  const account =
    options.account === undefined
      ? {
          id: 'sponsor-user',
          isBlocked: false,
          role: 'USER',
          currentSponsorId: 's1',
          hackathonId: null,
          UserSponsors: [{ sponsorId: 's1' }],
        }
      : options.account;

  const client = {
    user: {
      findUnique: async () => account,
      update: async ({ data }: { data: Row }) => {
        userUpdates.push(data);
        return data;
      },
    },
    bounties: {
      findFirst: async ({ where }: { where: Row }) =>
        where.slug === bounty.slug ? { ...bounty } : null,
      findUnique: async ({ where }: { where: Row }) =>
        where.id === bounty.id ? { ...bounty } : null,
      updateMany: async ({ where, data }: { where: Row; data: Row }) => {
        if (!matches(bounty, where)) return { count: 0 };
        Object.assign(bounty, data);
        return { count: 1 };
      },
    },
    submission: {
      // Copies, as Prisma returns: later writes don't change what was read.
      findMany: async ({ where }: { where: Row }) =>
        submissions
          .filter((row) => matches(row, where))
          .map((row) => ({ ...row })),
      findUnique: async ({ where }: { where: Row }) => {
        const found = submissions.find((row) => row.id === where.id);
        return found ? { ...found, listing: bounty } : null;
      },
      count: async ({ where }: { where: Row }) =>
        submissions.filter((row) => matches(row, where)).length,
      update: async ({ where, data }: { where: Row; data: Row }) => {
        const row = submissions.find((each) => each.id === where.id);
        if (!row) throw new Error('missing');
        return { ...Object.assign(row, data) };
      },
      updateMany: async ({ where, data }: { where: Row; data: Row }) => {
        const rows = submissions.filter((row) => matches(row, where));
        for (const row of rows) Object.assign(row, data);
        return { count: rows.length };
      },
    },
    comment: {
      create: async ({ data }: { data: Row }) => {
        comments.push(data);
        return data;
      },
    },
    $queryRaw: async () => (options.usedTxIds ?? []).map((txId) => ({ txId })),
  };
  const withTransaction = {
    ...client,
    $transaction: async (run: (tx: typeof client) => Promise<unknown>) =>
      run(client),
  };
  const layer = Layer.succeed(
    Database.Database,
    Database.Database.of({
      query: (_operation, run) =>
        Effect.promise(() => run(withTransaction as never)),
    }),
  );
  return { layer, bounty, submissions, comments, userUpdates };
};

// Records what the shared services were asked to do.
const fakes = (options: { readonly lockBusy?: boolean } = {}) => {
  const emails: Array<Queues.EmailJob> = [];
  const credits: Array<string> = [];
  const discord: Array<unknown> = [];
  const filed: Array<string> = [];
  const layer = Layer.mergeAll(
    Layer.succeed(
      Queues.Queues,
      Queues.Queues.of({
        email: (job) => Effect.sync(() => void emails.push(job)),
      }),
    ),
    Layer.succeed(
      Credits.Credits,
      Credits.Credits.of({
        balance: () => Effect.succeed(3),
        consume: () => Effect.void,
        winBonus: (userId, submissionId) =>
          Effect.sync(() => void credits.push(`win:${userId}:${submissionId}`)),
        grantWinBonus: () => Effect.void,
        spamPenalty: (submissionId) =>
          Effect.sync(() => void credits.push(`spam:${submissionId}`)),
        grantSpamPenalty: () => Effect.void,
        dispute: () => Effect.void,
        refundListing: () => Effect.void,
      }),
    ),
    Layer.succeed(
      Locks.Locks,
      Locks.Locks.of({
        with: (key, effect) =>
          options.lockBusy ? Effect.fail(new Locks.LockBusy({ key })) : effect,
      }),
    ),
    Layer.succeed(
      Earncognito.Earncognito,
      Earncognito.Earncognito.of({
        post: (path, body) =>
          Effect.sync(() => {
            discord.push({ path, body });
            return null;
          }),
      }),
    ),
    Layer.succeed(
      ReviewAirtable.ReviewAirtable,
      ReviewAirtable.ReviewAirtable.of({
        fileWinnerPayments: (userId) =>
          Effect.sync(() => void filed.push(userId)),
      }),
    ),
    // Follow-ups run inline, so tests see them.
    Layer.succeed(
      ReviewBackground.ReviewBackground,
      ReviewBackground.ReviewBackground.of({ run: (effect) => effect }),
    ),
  );
  return { layer, emails, credits, discord, filed };
};

const writer: Users.SponsorWriter = {
  userId: 'sponsor-user',
  privyDid: 'did:privy:sponsor',
  sponsorId: 's1',
  role: 'USER',
  god: false,
  hackathonId: null,
};
const stranger: Users.SponsorWriter = { ...writer, sponsorId: 's2' };

const run = <A, E>(
  database: ReturnType<typeof fakeDatabase>,
  shared: ReturnType<typeof fakes>,
  use: Effect.Effect<A, E, Review.Review | ReviewAnnounce.ReviewAnnounce>,
) =>
  Effect.gen(function* () {
    yield* TestClock.setTime(NOW);
    return yield* use;
  }).pipe(
    Effect.provide(
      Layer.mergeAll(Review.layer, ReviewAnnounce.layer).pipe(
        Layer.provide(Layer.merge(database.layer, shared.layer)),
      ),
    ),
  );

const failureTag = <A, E extends { readonly _tag: string }>(
  exit: Exit.Exit<A, E>,
) =>
  Exit.isFailure(exit) && exit.cause.reasons[0]?._tag === 'Fail'
    ? exit.cause.reasons[0].error._tag
    : null;

describe('Review.page', () => {
  it.effect(
    'loads the sponsor’s listing with submissions in review order',
    () =>
      Effect.gen(function* () {
        const database = fakeDatabase({
          submissions: [
            submission('spam', { label: 'Spam' }),
            submission('new'),
            submission('second', { isWinner: true, winnerPosition: 2 }),
            submission('shortlisted', { label: 'Shortlisted' }),
            submission('paid', {
              isPaid: true,
              isWinner: true,
              winnerPosition: 1,
            }),
          ],
        });
        const page = yield* run(
          database,
          fakes(),
          Review.Review.use((review) =>
            review.page('did:privy:sponsor', 'logo', false),
          ),
        );
        assert.strictEqual(page._tag, 'Ready');
        if (page._tag !== 'Ready') return;
        assert.deepStrictEqual(
          page.submissions.map((each) => each.id),
          ['paid', 'second', 'shortlisted', 'new', 'spam'],
        );
        assert.strictEqual(page.listing.totalPaymentsMade, 1);
        assert.strictEqual(page.listing.deadline, '2026-10-20T00:00:00.000Z');
      }),
  );

  it.effect('offers a switch to another sponsor they belong to', () =>
    Effect.gen(function* () {
      const database = fakeDatabase({
        bounty: { sponsorId: 's2' },
        account: {
          id: 'sponsor-user',
          isBlocked: false,
          role: 'USER',
          currentSponsorId: 's1',
          hackathonId: null,
          UserSponsors: [{ sponsorId: 's1' }, { sponsorId: 's2' }],
        },
      });
      const page = yield* run(
        database,
        fakes(),
        Review.Review.use((review) =>
          review.page('did:privy:sponsor', 'logo', false),
        ),
      );
      assert.deepStrictEqual(page, { _tag: 'Switch', sponsorId: 's2' });
    }),
  );

  it.effect(
    'refuses another sponsor’s listing, a missing one, the blocked',
    () =>
      Effect.gen(function* () {
        const other = yield* run(
          fakeDatabase({ bounty: { sponsorId: 's2' } }),
          fakes(),
          Review.Review.use((review) =>
            review.page('did:privy:sponsor', 'logo', false),
          ),
        );
        const missing = yield* run(
          fakeDatabase(),
          fakes(),
          Review.Review.use((review) =>
            review.page('did:privy:sponsor', 'nope', false),
          ),
        );
        const blocked = yield* run(
          fakeDatabase({
            account: {
              id: 'x',
              isBlocked: true,
              role: 'USER',
              currentSponsorId: 's1',
              hackathonId: null,
              UserSponsors: [],
            },
          }),
          fakes(),
          Review.Review.use((review) =>
            review.page('did:privy:sponsor', 'logo', false),
          ),
        );
        assert.deepStrictEqual(
          [other._tag, missing._tag, blocked._tag],
          ['Refused', 'Refused', 'Refused'],
        );
      }),
  );
});

describe('Review.updateLabel', () => {
  it.effect('marks spam: unwins, costs a credit and emails each entrant', () =>
    Effect.gen(function* () {
      const database = fakeDatabase({
        submissions: [
          submission('a', { isWinner: true, winnerPosition: 1 }),
          submission('b'),
        ],
      });
      const shared = fakes();
      yield* run(
        database,
        shared,
        Review.Review.use((review) =>
          review.updateLabel(writer, ['a', 'b'], 'Spam'),
        ),
      );
      assert.deepStrictEqual(
        database.submissions.map((row) => [row.label, row.isWinner]),
        [
          ['Spam', false],
          ['Spam', false],
        ],
      );
      assert.deepStrictEqual(shared.credits, ['spam:a', 'spam:b']);
      assert.deepStrictEqual(
        shared.emails.map((email) => [email.type, email.id, email.userId]),
        [
          ['spamCredit', 'a', 'u-a'],
          ['spamCredit', 'b', 'u-b'],
        ],
      );
    }),
  );

  it.effect('refuses several at once but for Spam and Shortlisted', () =>
    Effect.gen(function* () {
      const database = fakeDatabase({
        submissions: [submission('a'), submission('b')],
      });
      const exit = yield* run(
        database,
        fakes(),
        Review.Review.use((review) =>
          review.updateLabel(writer, ['a', 'b'], 'Reviewed'),
        ),
      ).pipe(Effect.exit);
      assert.strictEqual(failureTag(exit), 'ReviewInvalid');
    }),
  );

  it.effect('refuses another sponsor, missing ids, announced winners', () =>
    Effect.gen(function* () {
      const notYours = yield* run(
        fakeDatabase({ submissions: [submission('a')] }),
        fakes(),
        Review.Review.use((review) =>
          review.updateLabel(stranger, ['a'], 'Reviewed'),
        ),
      ).pipe(Effect.exit);
      const missing = yield* run(
        fakeDatabase({ submissions: [submission('a')] }),
        fakes(),
        Review.Review.use((review) =>
          review.updateLabel(writer, ['a', 'zz'], 'Spam'),
        ),
      ).pipe(Effect.exit);
      const announced = yield* run(
        fakeDatabase({
          bounty: { isWinnersAnnounced: true },
          submissions: [submission('a', { isWinner: true, winnerPosition: 1 })],
        }),
        fakes(),
        Review.Review.use((review) =>
          review.updateLabel(writer, ['a'], 'Spam'),
        ),
      ).pipe(Effect.exit);
      assert.deepStrictEqual(
        [failureTag(notYours), failureTag(missing), failureTag(announced)],
        ['NotYourListing', 'SubmissionsNotFound', 'ReviewInvalid'],
      );
    }),
  );
});

describe('Review.reject', () => {
  it.effect('rejects and emails each entrant; 50 at most', () =>
    Effect.gen(function* () {
      const database = fakeDatabase({
        submissions: [submission('a'), submission('b')],
      });
      const shared = fakes();
      const result = yield* run(
        database,
        shared,
        Review.Review.use((review) => review.reject(writer, ['a', 'b'])),
      );
      assert.strictEqual(result.count, 2);
      assert.deepStrictEqual(
        database.submissions.map((row) => row.status),
        ['Rejected', 'Rejected'],
      );
      assert.deepStrictEqual(
        shared.emails.map((email) => email.type),
        ['submissionRejected', 'submissionRejected'],
      );
      const tooMany = yield* run(
        database,
        shared,
        Review.Review.use((review) =>
          review.reject(
            writer,
            Array.from({ length: 51 }, (_, i) => `s${i}`),
          ),
        ),
      ).pipe(Effect.exit);
      assert.strictEqual(failureTag(tooMany), 'ReviewInvalid');
    }),
  );
});

describe('Review.toggleWinners', () => {
  it.effect('picks winners, taking a spam winner back to review', () =>
    Effect.gen(function* () {
      const database = fakeDatabase({
        submissions: [
          submission('a', { label: 'Spam', status: 'Rejected' }),
          submission('b'),
        ],
      });
      const result = yield* run(
        database,
        fakes(),
        Review.Review.use((review) =>
          review.toggleWinners(writer, [
            { id: 'a', isWinner: true, winnerPosition: 1 },
            { id: 'b', isWinner: true, winnerPosition: 99 },
          ]),
        ),
      );
      assert.deepStrictEqual(result.autoFixedSubmissions, ['a']);
      assert.deepStrictEqual(
        database.submissions.map((row) => [
          row.isWinner,
          row.winnerPosition,
          row.label,
          row.status,
        ]),
        [
          [true, 1, 'Unreviewed', 'Pending'],
          [true, 99, 'Unreviewed', 'Pending'],
        ],
      );
    }),
  );

  it.effect('refuses taken places, too many bonuses, announced listings', () =>
    Effect.gen(function* () {
      const taken = yield* run(
        fakeDatabase({
          submissions: [
            submission('a', { isWinner: true, winnerPosition: 1 }),
            submission('b'),
          ],
        }),
        fakes(),
        Review.Review.use((review) =>
          review.toggleWinners(writer, [
            { id: 'b', isWinner: true, winnerPosition: 1 },
          ]),
        ),
      ).pipe(Effect.exit);
      const bonuses = yield* run(
        fakeDatabase({
          submissions: [
            submission('a', { isWinner: true, winnerPosition: 99 }),
            submission('b'),
            submission('c'),
          ],
        }),
        fakes(),
        Review.Review.use((review) =>
          review.toggleWinners(writer, [
            { id: 'b', isWinner: true, winnerPosition: 99 },
            { id: 'c', isWinner: true, winnerPosition: 99 },
          ]),
        ),
      ).pipe(Effect.exit);
      const announced = yield* run(
        fakeDatabase({
          bounty: { isWinnersAnnounced: true },
          submissions: [submission('a')],
        }),
        fakes(),
        Review.Review.use((review) =>
          review.toggleWinners(writer, [
            { id: 'a', isWinner: true, winnerPosition: 1 },
          ]),
        ),
      ).pipe(Effect.exit);
      const half = yield* run(
        fakeDatabase({ submissions: [submission('a')] }),
        fakes(),
        Review.Review.use((review) =>
          review.toggleWinners(writer, [{ id: 'a', isWinner: true }]),
        ),
      ).pipe(Effect.exit);
      assert.deepStrictEqual(
        [taken, bonuses, announced, half].map(failureTag),
        ['ReviewInvalid', 'ReviewInvalid', 'ReviewInvalid', 'ReviewInvalid'],
      );
    }),
  );
});

const winners = () => [
  submission('first', { isWinner: true, winnerPosition: 1 }),
  submission('second', {
    isWinner: true,
    winnerPosition: 2,
    label: 'Shortlisted',
  }),
  submission('bonus', { isWinner: true, winnerPosition: 99 }),
];

describe('ReviewAnnounce.announce', () => {
  it.effect(
    'closes the listing, drops unfilled bonus spots, approves and credits winners',
    () =>
      Effect.gen(function* () {
        const database = fakeDatabase({ submissions: winners() });
        const shared = fakes();
        yield* run(
          database,
          shared,
          ReviewAnnounce.ReviewAnnounce.use((service) =>
            service.announce(writer, 'b1'),
          ),
        );
        const { bounty } = database;
        assert.isTrue(bounty.isWinnersAnnounced);
        assert.strictEqual(bounty.maxBonusSpots, 1);
        assert.strictEqual(bounty.rewardAmount, 850);
        assert.strictEqual(bounty.usdValue, 850);
        // Already past its deadline, which stays.
        assert.deepStrictEqual(bounty.deadline, new Date('2026-10-20'));
        const [first, second, bonus] = database.submissions;
        assert.deepStrictEqual(
          [first?.status, first?.label, first?.rewardInUSD],
          ['Approved', 'Reviewed', 500],
        );
        assert.deepStrictEqual(
          [second?.label, bonus?.rewardInUSD],
          ['Shortlisted', 50],
        );
        assert.deepStrictEqual(shared.credits, [
          'win:u-first:first',
          'win:u-second:second',
          'win:u-bonus:bonus',
        ]);
        assert.deepStrictEqual(shared.discord, [
          { path: '/discord/winners-announced', body: { listingId: 'b1' } },
        ]);
        assert.strictEqual(database.comments.length, 1);
        assert.include(
          String(database.comments[0]?.message),
          '@user-u-first and @user-u-second',
        );
        assert.deepStrictEqual(
          shared.emails.map((email) => email.type),
          ['announceWinners', 'nonSTWinners'],
        );
      }),
  );

  it.effect('files KYC’d winners’ payments when the foundation pays', () =>
    Effect.gen(function* () {
      const submissions = winners();
      const first = submissions[0];
      if (first) {
        first.user = {
          ...user('u-first'),
          isKYCVerified: true,
          kycVerifiedAt: new Date('2026-09-01'),
        };
      }
      const database = fakeDatabase({
        bounty: { isFndnPaying: true, deadline: new Date('2026-11-01') },
        submissions,
      });
      const shared = fakes();
      yield* run(
        database,
        shared,
        ReviewAnnounce.ReviewAnnounce.use((service) =>
          service.announce(writer, 'b1'),
        ),
      );
      assert.deepStrictEqual(shared.filed, ['u-first']);
      assert.deepStrictEqual(
        shared.emails.map((email) => email.type),
        ['announceWinners', 'STWinners'],
      );
      // Announced early: closed two minutes ago.
      assert.deepStrictEqual(
        database.bounty.deadline,
        new Date(NOW - 2 * 60 * 1000),
      );
    }),
  );

  it.effect('needs every place filled, and refuses twice or concurrently', () =>
    Effect.gen(function* () {
      const unfilled = yield* run(
        fakeDatabase({
          submissions: [
            submission('first', { isWinner: true, winnerPosition: 1 }),
            submission('second', { isWinner: true, winnerPosition: 2 }),
            // Still someone to give a bonus spot to.
            submission('other'),
          ],
        }),
        fakes(),
        ReviewAnnounce.ReviewAnnounce.use((service) =>
          service.announce(writer, 'b1'),
        ),
      ).pipe(Effect.exit);
      const twice = yield* run(
        fakeDatabase({ bounty: { isWinnersAnnounced: true } }),
        fakes(),
        ReviewAnnounce.ReviewAnnounce.use((service) =>
          service.announce(writer, 'b1'),
        ),
      ).pipe(Effect.exit);
      const busy = yield* run(
        fakeDatabase({ submissions: winners() }),
        fakes({ lockBusy: true }),
        ReviewAnnounce.ReviewAnnounce.use((service) =>
          service.announce(writer, 'b1'),
        ),
      ).pipe(Effect.exit);
      const notYours = yield* run(
        fakeDatabase({ submissions: winners() }),
        fakes(),
        ReviewAnnounce.ReviewAnnounce.use((service) =>
          service.announce(stranger, 'b1'),
        ),
      ).pipe(Effect.exit);
      assert.deepStrictEqual(
        [unfilled, twice, busy, notYours].map(failureTag),
        [
          'ReviewInvalid',
          'ReviewInvalid',
          'AlreadyAnnounced',
          'NotYourListing',
        ],
      );
    }),
  );

  it.effect('allows open bonus spots when nobody is left for them', () =>
    Effect.gen(function* () {
      const database = fakeDatabase({
        submissions: [
          submission('first', { isWinner: true, winnerPosition: 1 }),
          submission('second', { isWinner: true, winnerPosition: 2 }),
        ],
      });
      yield* run(
        database,
        fakes(),
        ReviewAnnounce.ReviewAnnounce.use((service) =>
          service.announce(writer, 'b1'),
        ),
      );
      assert.isTrue(database.bounty.isWinnersAnnounced);
      assert.deepStrictEqual(database.bounty.rewards, { '1': 500, '2': 300 });
      assert.strictEqual(database.bounty.maxBonusSpots, 0);
    }),
  );
});

const USDC = {
  tokenSymbol: 'USDC',
  mintAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  decimals: 6,
};

// A USDC transfer of `amount` to `owner`.
const tokenTransfer = (
  owner: string,
  amount: number,
  mint = USDC.mintAddress,
): ReviewChain.ChainTransaction => ({
  meta: {
    err: null,
    preBalances: [],
    postBalances: [],
    preTokenBalances: [
      { owner, mint, uiTokenAmount: { uiAmountString: '10' } },
    ],
    postTokenBalances: [
      { owner, mint, uiTokenAmount: { uiAmountString: String(10 + amount) } },
    ],
  },
  transaction: { message: { accountKeys: [] } },
});

describe('checkPayment', () => {
  const check = {
    recipient: 'winner',
    expectedAmount: 500,
    token: USDC,
    tokenPriceUSD: 1,
  };

  it('takes the amount within half a percent, to the recipient, in the token', () => {
    assert.deepStrictEqual(
      ReviewChain.checkPayment(tokenTransfer('winner', 499), check),
      { isValid: true, actualAmount: 499 },
    );
    assert.isFalse(
      ReviewChain.checkPayment(tokenTransfer('winner', 490), check).isValid,
    );
    assert.isFalse(
      ReviewChain.checkPayment(tokenTransfer('someone', 500), check).isValid,
    );
    assert.isFalse(
      ReviewChain.checkPayment(tokenTransfer('winner', 500, 'other'), check)
        .isValid,
    );
    assert.isFalse(ReviewChain.checkPayment(null, check).isValid);
  });

  it('checks native SOL by balance change', () => {
    const sol: ReviewChain.ChainTransaction = {
      meta: {
        err: null,
        preBalances: [5_000_000_000, 0],
        postBalances: [3_000_000_000, 2_000_000_000],
      },
      transaction: {
        message: {
          accountKeys: [
            'sponsor',
            'winner',
            '11111111111111111111111111111111',
          ],
        },
      },
    };
    const token = { tokenSymbol: 'SOL', mintAddress: 'sol', decimals: 9 };
    assert.deepStrictEqual(
      ReviewChain.checkPayment(sol, {
        recipient: 'winner',
        expectedAmount: 2,
        token,
        tokenPriceUSD: undefined,
      }),
      { isValid: true, actualAmount: 2 },
    );
    assert.isFalse(
      ReviewChain.checkPayment(sol, {
        recipient: 'winner',
        expectedAmount: 2,
        token: USDC,
        tokenPriceUSD: 1,
      }).isValid,
    );
  });
});

const runPayments = <A, E>(
  database: ReturnType<typeof fakeDatabase>,
  shared: ReturnType<typeof fakes>,
  transactions: Record<string, ReviewChain.ChainTransaction>,
  use: Effect.Effect<A, E, ReviewPayments.ReviewPayments>,
) =>
  use.pipe(
    Effect.provide(
      ReviewPayments.layer.pipe(
        Layer.provide(
          Layer.mergeAll(
            database.layer,
            shared.layer,
            Layer.succeed(
              ReviewChain.ReviewChain,
              ReviewChain.ReviewChain.of({
                token: () => Effect.succeed(USDC),
                price: () => Effect.succeed(1),
                transaction: (txId) =>
                  Effect.succeed(transactions[txId] ?? null),
              }),
            ),
          ),
        ),
      ),
    ),
  );

const winner = () =>
  submission('w', {
    isWinner: true,
    winnerPosition: 1,
    user: user('winner'),
  });

const setup = (usedTxIds: Array<string> = []) => {
  const database = fakeDatabase({ submissions: [winner()], usedTxIds });
  database.submissions[0] = {
    ...database.submissions[0],
    user: { walletAddress: 'winner' },
  };
  return database;
};

const pay = (who: Users.SponsorWriter) =>
  ReviewPayments.ReviewPayments.use((payments) =>
    payments.addPayment(who, 'w', [{ txId: 'sig1', amount: 500, tranche: 1 }]),
  );

describe('ReviewPayments', () => {
  it.effect('records a checked payment and emails about it', () =>
    Effect.gen(function* () {
      const database = fakeDatabase({
        bounty: { isWinnersAnnounced: true },
        submissions: [winner()],
      });
      database.submissions[0] = {
        ...database.submissions[0],
        user: { walletAddress: 'winner' },
      };
      const shared = fakes();
      const result = yield* runPayments(
        database,
        shared,
        { sig1: tokenTransfer('winner', 500) },
        ReviewPayments.ReviewPayments.use((payments) =>
          payments.addPayment(writer, 'w', [
            { txId: 'sig1', amount: 500, tranche: 1 },
          ]),
        ),
      );
      assert.isTrue(result.isPaid);
      assert.deepStrictEqual(
        shared.emails.map((email) => [email.type, email.id]),
        [['addPayment', 'w']],
      );
    }),
  );

  it.effect('refuses a used signature, a bad transfer, another sponsor', () =>
    Effect.gen(function* () {
      const used = yield* runPayments(
        setup(['sig1']),
        fakes(),
        { sig1: tokenTransfer('winner', 500) },
        pay(writer),
      ).pipe(Effect.exit);
      const short = yield* runPayments(
        setup(),
        fakes(),
        { sig1: tokenTransfer('winner', 100) },
        pay(writer),
      ).pipe(Effect.exit);
      const notYours = yield* runPayments(
        setup(),
        fakes(),
        { sig1: tokenTransfer('winner', 500) },
        pay(stranger),
      ).pipe(Effect.exit);
      assert.deepStrictEqual([used, short, notYours].map(failureTag), [
        'ReviewInvalid',
        'ReviewInvalid',
        'NotYourListing',
      ]);
    }),
  );

  it.effect('verifies external payments one by one and records the good', () =>
    Effect.gen(function* () {
      const database = fakeDatabase({
        bounty: { isWinnersAnnounced: true },
        submissions: [
          submission('a', { isWinner: true, winnerPosition: 1 }),
          submission('b', { isWinner: true, winnerPosition: 2 }),
        ],
      });
      database.submissions[0] = {
        ...database.submissions[0],
        user: { walletAddress: 'wa' },
      };
      database.submissions[1] = {
        ...database.submissions[1],
        user: { walletAddress: 'wb' },
      };
      const fiber = yield* runPayments(
        database,
        fakes(),
        { good: tokenTransfer('wa', 500), bad: tokenTransfer('wb', 1) },
        ReviewPayments.ReviewPayments.use((payments) =>
          payments.verifyExternal(writer, 'b1', [
            {
              submissionId: 'a',
              isVerified: false,
              txId: 'good',
              link: 'https://solscan.io/tx/good',
            },
            {
              submissionId: 'b',
              isVerified: false,
              txId: 'bad',
              link: 'https://solscan.io/tx/bad',
            },
          ]),
        ),
      ).pipe(Effect.forkChild);
      yield* TestClock.adjust('10 seconds');
      const results = yield* Fiber.join(fiber);
      assert.deepStrictEqual(
        results.map((result) => [result.submissionId, result.status]),
        [
          ['a', 'SUCCESS'],
          ['b', 'FAIL'],
        ],
      );
      assert.deepStrictEqual(
        database.submissions.map((row) => row.isPaid),
        [true, false],
      );
    }),
  );
});
