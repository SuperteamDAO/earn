import { assert, describe, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';

import * as Database from '@/server/database';
import * as ListingDetails from '@/server/listing-details';

interface Options {
  previewUser?: Record<string, unknown> | null;
  listing?: Record<string, unknown> | null;
  submission?: Record<string, unknown> | null;
  submissions?: Array<Record<string, unknown>>;
}

// A stand-in for Prisma: only the calls the service makes.
const fakeDatabase = (options: Options = {}) => {
  const queries: Array<{ call: string; args: unknown }> = [];
  const record =
    (call: string, result: () => unknown) => async (args: unknown) => {
      queries.push({ call, args });
      return result();
    };
  const client = {
    user: { findUnique: async () => options.previewUser ?? null },
    bounties: {
      findFirst: record('bounties.findFirst', () =>
        'listing' in options
          ? options.listing
          : {
              id: 'b1',
              slug: 'build',
              isWinnersAnnounced: true,
              deadline: new Date('2026-10-01T00:00:00Z'),
            },
      ),
    },
    submission: {
      findFirst: async () => options.submission ?? null,
      findMany: async () => options.submissions ?? [],
    },
  };
  const layer = ListingDetails.layer.pipe(
    Layer.provide(
      Layer.succeed(
        Database.Database,
        Database.Database.of({
          // The fake has only what the service calls.
          // oxlint-disable-next-line typescript/no-unsafe-type-assertion
          query: (_operation, run) =>
            Effect.promise(() => run(client as never)),
        }),
      ),
    ),
  );
  return { layer, queries };
};

const run = <A, E>(
  fake: ReturnType<typeof fakeDatabase>,
  use: (
    service: ListingDetails.ListingDetails['Service'],
  ) => Effect.Effect<A, E>,
) => ListingDetails.ListingDetails.use(use).pipe(Effect.provide(fake.layer));

const whereOf = (fake: ReturnType<typeof fakeDatabase>) =>
  (fake.queries[0]?.args as { where: Record<string, unknown> } | undefined)
    ?.where ?? {};

describe('ListingDetails.previewAccess', () => {
  it.effect('lets GOD preview everything, members their sponsors’', () =>
    Effect.gen(function* () {
      const god = fakeDatabase({
        previewUser: { isBlocked: false, role: 'GOD', UserSponsors: [] },
      });
      assert.deepStrictEqual(
        yield* run(god, (details) => details.previewAccess('u1')),
        { all: true, sponsorIds: [] },
      );
      const member = fakeDatabase({
        previewUser: {
          isBlocked: false,
          role: 'USER',
          UserSponsors: [{ sponsorId: 's1' }],
        },
      });
      assert.deepStrictEqual(
        yield* run(member, (details) => details.previewAccess('u1')),
        { all: false, sponsorIds: ['s1'] },
      );
      const blocked = fakeDatabase({
        previewUser: { isBlocked: true, role: 'GOD', UserSponsors: [] },
      });
      assert.deepStrictEqual(
        yield* run(blocked, (details) => details.previewAccess('u1')),
        ListingDetails.NO_PREVIEW,
      );
    }),
  );
});

describe('ListingDetails.bySlug', () => {
  it.effect('shows only published listings without preview access', () =>
    Effect.gen(function* () {
      const fake = fakeDatabase();
      const listing = yield* run(fake, (details) => details.bySlug('build'));
      assert.isTrue(Option.isSome(listing));
      // Dates arrive as text, as Earn's API sent them.
      assert.strictEqual(
        Option.getOrThrow(listing).deadline,
        '2026-10-01T00:00:00.000Z',
      );
      assert.deepStrictEqual(whereOf(fake), {
        slug: 'build',
        isActive: true,
        isArchived: false,
        isPublished: true,
      });
    }),
  );

  it.effect('lets a sponsor’s members see its unpublished listings', () =>
    Effect.gen(function* () {
      const fake = fakeDatabase();
      yield* run(fake, (details) =>
        details.bySlug('build', { all: false, sponsorIds: ['s1'] }),
      );
      assert.deepStrictEqual(whereOf(fake).OR, [
        { isPublished: true },
        { sponsorId: { in: ['s1'] } },
      ]);
    }),
  );
});

describe('ListingDetails.viewerEntry', () => {
  const entry = {
    id: 's1',
    status: 'Pending',
    isWinner: true,
    isPaid: false,
    winnerPosition: 1,
    paymentSynced: false,
    link: 'https://example.com',
    tweet: null,
    otherInfo: null,
    eligibilityAnswers: [],
    user: {
      isKYCVerified: false,
      kycVerifiedAt: null,
      kycCountry: null,
    },
  };

  it.effect('keeps winner details back until winners are announced', () =>
    Effect.gen(function* () {
      const fake = fakeDatabase({
        submission: {
          ...entry,
          listing: { isWinnersAnnounced: false, region: 'Global' },
        },
      });
      const found = yield* run(fake, (details) =>
        details.viewerEntry('u1', 'b1'),
      );
      assert.isTrue(found.isSubmitted);
      assert.isUndefined(found.isWinner);
      assert.strictEqual(found.form?.tweet, '');
    }),
  );

  it.effect('tells a winner where their payout stands', () =>
    Effect.gen(function* () {
      const fake = fakeDatabase({
        submission: {
          ...entry,
          listing: { isWinnersAnnounced: true, region: 'India' },
        },
      });
      const found = yield* run(fake, (details) =>
        details.viewerEntry('u1', 'b1'),
      );
      assert.strictEqual(found.isWinner, true);
      assert.strictEqual(found.isKYCVerified, false);
      assert.strictEqual(found.listingRegion, 'India');
    }),
  );

  it.effect('reads as not submitted without an entry', () =>
    Effect.gen(function* () {
      const fake = fakeDatabase();
      assert.deepStrictEqual(
        yield* run(fake, (details) => details.viewerEntry('u1', 'b1')),
        { isSubmitted: false, status: null },
      );
    }),
  );
});

describe('ListingDetails.submissionsTab', () => {
  it.effect('lists winners by position, then the newest', () =>
    Effect.gen(function* () {
      const user = {
        id: 'u',
        firstName: null,
        lastName: null,
        photo: null,
        username: null,
      };
      const fake = fakeDatabase({
        submissions: [
          { id: 'old', winnerPosition: null, createdAt: new Date(1), user },
          { id: 'second', winnerPosition: 2, createdAt: new Date(2), user },
          { id: 'new', winnerPosition: null, createdAt: new Date(3), user },
          { id: 'first', winnerPosition: 1, createdAt: new Date(4), user },
        ],
      });
      const tab = yield* run(fake, (details) =>
        details.submissionsTab('build'),
      );
      assert.deepStrictEqual(
        tab.submission.map(({ id }) => id),
        ['first', 'second', 'new', 'old'],
      );
    }),
  );

  it.effect('shows no submissions before winners are announced', () =>
    Effect.gen(function* () {
      const fake = fakeDatabase({
        listing: { id: 'b1', isWinnersAnnounced: false },
        submissions: [{ id: 'hidden' }],
      });
      const tab = yield* run(fake, (details) =>
        details.submissionsTab('build'),
      );
      assert.deepStrictEqual(tab.submission, []);
      assert.isNotNull(tab.bounty);
    }),
  );
});
