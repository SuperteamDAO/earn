import { assert, describe, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Layer from 'effect/Layer';
import { TestClock } from 'effect/testing';

import * as AppConfig from '@/server/app-config';
import * as Credits from '@/server/credits';
import * as Database from '@/server/database';
import * as Earncognito from '@/server/earncognito';
import * as ListingBuilder from '@/server/listing-builder';
import type { ListingBody } from '@/server/listing-rules';
import * as Queues from '@/server/queues';
import { testConfig } from '@/server/test-config';
import * as Tokens from '@/server/tokens';
import type { SponsorWriter } from '@/server/users';

const NOW = Date.parse('2026-10-20T12:00:00Z');
const DAY = 86_400_000;

type Row = Record<string, unknown>;

const number = (x: unknown) => (x instanceof Date ? x.getTime() : Number(x));

// Prisma's where, as far as the builder uses it.
function matches(row: Row, where: Row | undefined): boolean {
  if (!where) return true;
  return Object.entries(where).every(([key, condition]) => {
    if (condition === undefined) return true;
    if (key === 'NOT') return !matches(row, condition as Row);
    if (key === 'OR') {
      return (condition as Array<Row>).some((part) => matches(row, part));
    }
    const value = row[key];
    if (condition === null || typeof condition !== 'object') {
      return value === condition;
    }
    if (condition instanceof Date) {
      return value instanceof Date && value.getTime() === condition.getTime();
    }
    const ops = condition as Row;
    return Object.entries(ops).every(([op, operand]) => {
      switch (op) {
        case 'not':
          return operand === null
            ? value !== null && value !== undefined
            : value !== operand;
        case 'lt':
          return value != null && number(value) < number(operand);
        case 'lte':
          return value != null && number(value) <= number(operand);
        case 'gt':
          return value != null && number(value) > number(operand);
        case 'in':
          return (operand as Array<unknown>).includes(value);
        case 'startsWith':
          return String(value).startsWith(String(operand));
        default:
          return true;
      }
    });
  });
}

interface Options {
  role?: string;
  sponsor?: Row;
  bounties?: Array<Row>;
  submissions?: Array<Row>;
  memberOf?: Array<string>;
  config?: Partial<typeof testConfig>;
  price?: number | null;
}

const sponsorRow = (overrides: Row = {}) => ({
  id: 's1',
  name: 'Acme',
  slug: 'acme',
  isVerified: true,
  isCaution: false,
  chapter: null,
  ...overrides,
});

const bounty = (overrides: Row = {}): Row => ({
  id: 'b1',
  title: 'Design a logo',
  slug: 'design-a-logo',
  description: '<p>Make us a logo.</p>',
  deadline: new Date(NOW + 7 * DAY),
  commitmentDate: new Date(NOW + 21 * DAY),
  eligibility: [],
  status: 'OPEN',
  token: 'USDC',
  rewardAmount: 800,
  rewards: { '1': 500, '2': 300 },
  maxBonusSpots: 0,
  tokenUsdAtPublish: null,
  sponsorId: 's1',
  pocId: 'u1',
  pocSocials: 'https://x.com/acme',
  isPublished: false,
  isActive: true,
  isArchived: false,
  isFeatured: false,
  isPrivate: false,
  isFndnPaying: false,
  isWinnersAnnounced: false,
  winnersAnnouncedAt: null,
  publishedAt: null,
  publishedBy: null,
  skills: [{ skills: 'Design', subskills: ['Graphic Design'] }],
  type: 'bounty',
  region: 'Global',
  templateId: null,
  hackathonId: null,
  compensationType: 'fixed',
  minRewardAsk: null,
  maxRewardAsk: null,
  referredBy: null,
  createdAt: new Date(NOW - 30 * DAY),
  ...overrides,
});

const form = (overrides: Partial<ListingBody> = {}): ListingBody => ({
  id: 'b1',
  title: 'Design a logo',
  slug: 'design-a-logo',
  pocSocials: 'https://x.com/acme',
  description: '<p>Make us a logo.</p>',
  type: 'bounty',
  region: 'Global',
  referredBy: null,
  deadline: new Date(NOW + 7 * DAY).toISOString(),
  commitmentDate: new Date(NOW + 21 * DAY).toISOString(),
  templateId: null,
  eligibility: [],
  skills: [{ skills: 'Design', subskills: ['Graphic Design'] }],
  token: 'USDC',
  rewardAmount: 800,
  rewards: { '1': 500, '2': 300 },
  compensationType: 'fixed',
  minRewardAsk: null,
  maxRewardAsk: null,
  maxBonusSpots: null,
  isFndnPaying: false,
  isPrivate: false,
  hackathonId: null,
  ...overrides,
});

const writer: SponsorWriter = {
  userId: 'u1',
  privyDid: 'did:privy:u1',
  sponsorId: 's1',
  role: 'USER',
  god: false,
  hackathonId: null,
};

const USDC: Tokens.Token = {
  tokenName: 'USD Coin',
  tokenSymbol: 'USDC',
  mintAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  icon: '/assets/usdc.svg',
  decimals: 6,
  sortOrder: 1,
  isActive: true,
  isVerifiedOnJupiter: true,
};

const setup = (options: Options = {}) => {
  const sponsor = sponsorRow(options.sponsor);
  const bounties: Array<Row> = (options.bounties ?? [bounty()]).map((row) => ({
    ...row,
  }));
  const submissions: Array<Row> = options.submissions ?? [];
  const comments: Array<Row> = [];
  const emails: Array<Queues.EmailJob> = [];
  const posts: Array<{ path: string; body: unknown }> = [];
  const refunds: Array<string> = [];

  const withSponsor = (row: Row | undefined) =>
    row
      ? {
          ...row,
          sponsor:
            row.sponsorId === sponsor.id
              ? sponsor
              : sponsorRow({ id: row.sponsorId }),
        }
      : null;

  const client = {
    user: {
      findUnique: async () => ({
        id: 'u1',
        role: options.role ?? 'USER',
        currentSponsorId: 's1',
        UserSponsors: (options.memberOf ?? ['s1']).map((sponsorId) => ({
          sponsorId,
        })),
      }),
    },
    hackathon: {
      findUnique: async () => null,
      findMany: async () => [],
    },
    chapter: { findMany: async () => [] },
    comment: {
      create: async ({ data }: { data: Row }) => {
        comments.push(data);
        return data;
      },
    },
    bounties: {
      findUnique: async ({ where }: { where: Row }) =>
        withSponsor(bounties.find((row) => row.id === where.id)),
      findUniqueOrThrow: async ({ where }: { where: Row }) =>
        withSponsor(bounties.find((row) => row.id === where.id)),
      findFirst: async ({ where }: { where: Row }) =>
        bounties.find((row) => matches(row, where)) ?? null,
      findMany: async ({ where }: { where: Row }) =>
        bounties.filter((row) => matches(row, where)),
      count: async ({ where }: { where: Row }) =>
        bounties.filter((row) => matches(row, where)).length,
      create: async ({ data }: { data: Row }) => {
        const row = bounty({ id: `b${bounties.length + 1}`, ...data });
        bounties.push(row);
        return row;
      },
      update: async ({ where, data }: { where: Row; data: Row }) => {
        const row = bounties.find((item) => item.id === where.id);
        if (!row) throw new Error('No bounty');
        return Object.assign(row, data);
      },
    },
    submission: {
      count: async ({ where }: { where: Row }) =>
        submissions.filter((row) => matches(row, where)).length,
      findMany: async ({ where, take }: { where: Row; take?: number }) =>
        submissions.filter((row) => matches(row, where)).slice(0, take),
      updateMany: async ({ where, data }: { where: Row; data: Row }) => {
        const rows = submissions.filter((row) => matches(row, where));
        for (const row of rows) Object.assign(row, data);
        return { count: rows.length };
      },
    },
  };

  const layer = ListingBuilder.layer.pipe(
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
          AppConfig.AppConfig,
          AppConfig.AppConfig.of({
            ...testConfig,
            isEarnBase: true,
            ...options.config,
          }),
        ),
        Layer.succeed(
          Queues.Queues,
          Queues.Queues.of({
            email: (job) => Effect.sync(() => void emails.push(job)),
          }),
        ),
        Layer.succeed(
          Earncognito.Earncognito,
          Earncognito.Earncognito.of({
            post: (path, body) =>
              Effect.sync(() => {
                posts.push({ path, body });
                return null;
              }),
          }),
        ),
        Layer.succeed(
          Credits.Credits,
          Credits.Credits.of({
            balance: () => Effect.succeed(3),
            consume: () => Effect.void,
            winBonus: () => Effect.void,
            grantWinBonus: () => Effect.void,
            spamPenalty: () => Effect.void,
            grantSpamPenalty: () => Effect.void,
            dispute: () => Effect.void,
            refundListing: (id) => Effect.sync(() => void refunds.push(id)),
          }),
        ),
        Layer.succeed(
          Tokens.Tokens,
          Tokens.Tokens.of({
            list: Effect.succeed([USDC]),
            search: () => Effect.succeed({ tokens: [USDC], jupiterTokens: [] }),
            bySymbol: (symbol) =>
              Effect.succeed(symbol === 'USDC' ? USDC : null),
            addFromJupiter: () => Effect.succeed(USDC),
            usdPrice: () =>
              Effect.succeed(options.price === undefined ? 1 : options.price),
            icon: () =>
              Effect.succeed({
                image: Buffer.from(''),
                contentType: 'image/png',
              }),
          }),
        ),
      ),
    ),
  );

  return { layer, bounties, submissions, comments, emails, posts, refunds };
};

const run = <A, E>(
  world: ReturnType<typeof setup>,
  use: (
    builder: ListingBuilder.ListingBuilder['Service'],
  ) => Effect.Effect<A, E>,
) =>
  Effect.gen(function* () {
    yield* TestClock.setTime(NOW);
    const builder = yield* ListingBuilder.ListingBuilder;
    return yield* use(builder);
  }).pipe(Effect.provide(world.layer));

const failureTag = <A, E extends { readonly _tag: string }>(
  exit: Exit.Exit<A, E>,
) =>
  Exit.isFailure(exit)
    ? exit.cause.reasons.flatMap((reason) =>
        reason._tag === 'Fail' ? [reason.error._tag] : [],
      )[0]
    : null;

describe('ListingBuilder.saveDraft', () => {
  it.effect('refuses another sponsor’s listing', () =>
    Effect.gen(function* () {
      const world = setup({ bounties: [bounty({ sponsorId: 's2' })] });
      const exit = yield* run(world, (builder) =>
        builder.saveDraft(writer, form()),
      ).pipe(Effect.exit);
      assert.strictEqual(failureTag(exit), 'NotYourListing');
    }),
  );

  it.effect('refuses to draft over a published listing', () =>
    Effect.gen(function* () {
      const world = setup({ bounties: [bounty({ isPublished: true })] });
      const exit = yield* run(world, (builder) =>
        builder.saveDraft(writer, form()),
      ).pipe(Effect.exit);
      assert.strictEqual(failureTag(exit), 'ListingRefused');
    }),
  );

  it.effect('creates a new draft under a free slug, poc the writer', () =>
    Effect.gen(function* () {
      const world = setup();
      const saved = yield* run(world, (builder) =>
        builder.saveDraft(writer, form({ id: null, slug: '' })),
      );
      assert.strictEqual(saved.slug, 'design-a-logo-1');
      assert.strictEqual(saved.pocId, 'u1');
      assert.strictEqual(saved.sponsorId, 's1');
      assert.isFalse(saved.isPublished);
    }),
  );

  it.effect('keeps the saved slug when the new one is taken', () =>
    Effect.gen(function* () {
      const world = setup({
        bounties: [bounty(), bounty({ id: 'b2', slug: 'taken' })],
      });
      const saved = yield* run(world, (builder) =>
        builder.saveDraft(writer, form({ slug: 'taken' })),
      );
      assert.strictEqual(saved.slug, 'design-a-logo');
    }),
  );

  it.effect('refuses a region Earn doesn’t know', () =>
    Effect.gen(function* () {
      const world = setup();
      const exit = yield* run(world, (builder) =>
        builder.saveDraft(writer, form({ region: 'Atlantis' })),
      ).pipe(Effect.exit);
      assert.strictEqual(failureTag(exit), 'ListingRefused');
    }),
  );
});

describe('ListingBuilder.publish', () => {
  it.effect(
    'publishes a verified sponsor’s listing, priced, and posts it',
    () =>
      Effect.gen(function* () {
        const world = setup({
          bounties: [
            bounty(),
            bounty({
              id: 'b0',
              slug: 'old',
              isPublished: true,
              publishedAt: new Date(NOW - 60 * DAY),
              isWinnersAnnounced: true,
            }),
          ],
        });
        const result = yield* run(world, (builder) =>
          builder.publish(writer, 'b1', form()),
        );
        assert.isTrue(result.isPublished);
        assert.strictEqual(result.status, 'OPEN');
        assert.strictEqual(result.usdValue, 800);
        assert.strictEqual(result.tokenUsdAtPublish, 1);
        assert.strictEqual(result.publishedBy, 'u1');
        assert.isFalse(result.isFirstPublishedListing);
        assert.deepStrictEqual(world.posts, [
          {
            path: '/discord/listing-update',
            body: { listingId: 'b1', status: 'Published' },
          },
        ]);
        assert.deepStrictEqual(
          world.emails.map((job) => [job.type, job.id, job.delay]),
          [['telegramNewListing', 'b1', 3 * 60 * 60 * 1000]],
        );
      }),
  );

  it.effect(
    'holds a new unverified sponsor’s first listing for verification',
    () =>
      Effect.gen(function* () {
        const world = setup({ sponsor: { isVerified: false } });
        const result = yield* run(world, (builder) =>
          builder.publish(writer, 'b1', form()),
        );
        assert.isFalse(result.isPublished);
        assert.strictEqual(result.status, 'VERIFYING');
        assert.isNull(result.publishedAt);
        assert.strictEqual(result.reason, 'New sponsor');
        // Not priced while it waits.
        assert.strictEqual(result.usdValue, undefined);
        assert.deepStrictEqual(world.posts[0]?.body, {
          listingId: 'b1',
          status: 'To be Verified: New sponsor',
        });
        assert.strictEqual(world.emails[0]?.type, 'telegramNewListing');
      }),
  );

  it.effect('holds a cautioned sponsor’s listing', () =>
    Effect.gen(function* () {
      const world = setup({ sponsor: { isVerified: false, isCaution: true } });
      const result = yield* run(world, (builder) =>
        builder.publish(writer, 'b1', form()),
      );
      assert.strictEqual(result.status, 'VERIFYING');
      assert.strictEqual(result.reason, 'Sponsor marked as caution');
    }),
  );

  it.effect('skips verification off Earn’s own deployment', () =>
    Effect.gen(function* () {
      const world = setup({
        sponsor: { isVerified: false },
        config: { isEarnBase: false },
      });
      const result = yield* run(world, (builder) =>
        builder.publish(writer, 'b1', form()),
      );
      assert.strictEqual(result.status, 'OPEN');
      assert.isTrue(result.isFirstPublishedListing);
    }),
  );

  it.effect('refuses an invalid listing without saving or posting', () =>
    Effect.gen(function* () {
      const world = setup();
      const exit = yield* run(world, (builder) =>
        builder.publish(
          writer,
          'b1',
          form({ rewards: { '1': 500 }, token: 'DOGE' }),
        ),
      ).pipe(Effect.exit);
      assert.strictEqual(failureTag(exit), 'InvalidListing');
      assert.isFalse(world.bounties[0]?.isPublished);
      assert.deepStrictEqual(world.posts, []);
      assert.deepStrictEqual(world.emails, []);
    }),
  );

  it.effect('refuses a listing already published', () =>
    Effect.gen(function* () {
      const world = setup({ bounties: [bounty({ isPublished: true })] });
      const exit = yield* run(world, (builder) =>
        builder.publish(writer, 'b1', form()),
      ).pipe(Effect.exit);
      assert.strictEqual(failureTag(exit), 'ListingRefused');
    }),
  );
});

const live = (overrides: Row = {}) =>
  bounty({
    isPublished: true,
    publishedAt: new Date(NOW - 2 * DAY),
    tokenUsdAtPublish: 1,
    ...overrides,
  });

describe('ListingBuilder.update', () => {
  it.effect('notes a moved deadline in a comment and an email', () =>
    Effect.gen(function* () {
      const world = setup({ bounties: [live()] });
      const deadline = new Date(NOW + 10 * DAY).toISOString();
      yield* run(world, (builder) =>
        builder.update(writer, 'b1', form({ deadline })),
      );
      assert.strictEqual(world.comments.length, 1);
      assert.strictEqual(world.comments[0]?.type, 'DEADLINE_EXTENSION');
      assert.include(
        String(world.comments[0]?.message),
        '12:00 PM, October 30, 2026 (UTC)',
      );
      assert.deepStrictEqual(
        world.emails.map((job) => job.type),
        ['deadlineExtended'],
      );
      assert.deepStrictEqual(world.posts[0]?.body, {
        listingId: 'b1',
        status: 'Updated',
      });
      // Still live, still the publisher's.
      assert.isTrue(world.bounties[0]?.isPublished);
    }),
  );

  it.effect('refuses to extend a deadline by more than two weeks', () =>
    Effect.gen(function* () {
      const world = setup({ bounties: [live()] });
      const exit = yield* run(world, (builder) =>
        builder.update(
          writer,
          'b1',
          form({
            deadline: new Date(NOW + 30 * DAY).toISOString(),
            commitmentDate: new Date(NOW + 40 * DAY).toISOString(),
          }),
        ),
      ).pipe(Effect.exit);
      assert.strictEqual(failureTag(exit), 'InvalidListing');
    }),
  );

  it.effect('refuses edits past the deadline, except in God mode', () =>
    Effect.gen(function* () {
      const past = live({
        deadline: new Date(NOW - DAY),
        commitmentDate: new Date(NOW + 10 * DAY),
      });
      const refused = yield* run(setup({ bounties: [past] }), (builder) =>
        builder.update(writer, 'b1', form()),
      ).pipe(Effect.exit);
      assert.strictEqual(failureTag(refused), 'ListingRefused');
      const god = yield* run(
        setup({ bounties: [past], role: 'GOD' }),
        (builder) => builder.update(writer, 'b1', form()),
      ).pipe(Effect.exit);
      assert.isTrue(Exit.isSuccess(god));
    }),
  );

  it.effect('takes the win from places the new podium drops', () =>
    Effect.gen(function* () {
      const world = setup({
        bounties: [live()],
        submissions: [
          { id: 'w1', listingId: 'b1', isWinner: true, winnerPosition: 1 },
          { id: 'w2', listingId: 'b1', isWinner: true, winnerPosition: 2 },
        ],
      });
      yield* run(world, (builder) =>
        builder.update(
          writer,
          'b1',
          form({ rewards: { '1': 800 }, rewardAmount: 800 }),
        ),
      );
      assert.deepStrictEqual(
        world.submissions.map((row) => [row.id, row.isWinner]),
        [
          ['w1', true],
          ['w2', false],
        ],
      );
    }),
  );
});

describe('ListingBuilder.unpublish', () => {
  it.effect(
    'takes it down, resets winners, refunds and tells earncognito',
    () =>
      Effect.gen(function* () {
        const world = setup({
          bounties: [live()],
          submissions: [
            { id: 'w1', listingId: 'b1', isWinner: true, winnerPosition: 1 },
          ],
        });
        yield* run(world, (builder) => builder.unpublish(writer, 'b1'));
        assert.isFalse(world.bounties[0]?.isPublished);
        assert.isFalse(world.submissions[0]?.isWinner);
        assert.deepStrictEqual(world.refunds, ['b1']);
        assert.deepStrictEqual(
          world.posts.map((post) => post.path),
          ['/discord/listing-update', '/telegram/unpublish-listing'],
        );
      }),
  );

  it.effect('refuses once winners are announced', () =>
    Effect.gen(function* () {
      const world = setup({ bounties: [live({ isWinnersAnnounced: true })] });
      const exit = yield* run(world, (builder) =>
        builder.unpublish(writer, 'b1'),
      ).pipe(Effect.exit);
      assert.strictEqual(failureTag(exit), 'ListingRefused');
      assert.deepStrictEqual(world.refunds, []);
    }),
  );
});

describe('ListingBuilder.remove', () => {
  it.effect('hides a draft, never a published listing', () =>
    Effect.gen(function* () {
      const world = setup({
        bounties: [bounty(), live({ id: 'b2', slug: 'live' })],
      });
      yield* run(world, (builder) => builder.remove(writer, 'b1'));
      assert.isFalse(world.bounties[0]?.isActive);
      const exit = yield* run(world, (builder) =>
        builder.remove(writer, 'b2'),
      ).pipe(Effect.exit);
      assert.strictEqual(failureTag(exit), 'ListingRefused');
      assert.isTrue(world.bounties[1]?.isActive);
    }),
  );
});

describe('ListingBuilder.page', () => {
  it.effect('switches a team member to the listing’s sponsor', () =>
    Effect.gen(function* () {
      const world = setup({
        bounties: [bounty({ sponsorId: 's2' })],
        memberOf: ['s1', 's2'],
      });
      const page = yield* run(world, (builder) =>
        builder.page('did:privy:u1', 'design-a-logo'),
      );
      assert.deepStrictEqual(page, { kind: 'other-sponsor', sponsorId: 's2' });
      const outsider = yield* run(
        setup({ bounties: [bounty({ sponsorId: 's2' })] }),
        (builder) => builder.page('did:privy:u1', 'design-a-logo'),
      );
      assert.deepStrictEqual(outsider, {
        kind: 'other-sponsor',
        sponsorId: null,
      });
    }),
  );

  it.effect('locks creating with five listings awaiting winners', () =>
    Effect.gen(function* () {
      const overdue = Array.from({ length: 5 }, (_, index) =>
        live({
          id: `o${index}`,
          slug: `o${index}`,
          deadline: new Date(NOW - DAY),
        }),
      );
      const page = yield* run(setup({ bounties: overdue }), (builder) =>
        builder.page('did:privy:u1', null),
      );
      assert.strictEqual(page.kind === 'ready' && page.createAllowed, false);
    }),
  );
});
