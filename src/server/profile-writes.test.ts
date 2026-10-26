import { assert, describe, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { TestClock } from 'effect/testing';

import * as Database from '@/server/database';
import * as ImageStore from '@/server/image-store';
import * as PrivyApi from '@/server/privy-api';
import * as ProfileWrites from '@/server/profile-writes';

import type { ProfileBody } from '@/features/talent/utils/profile-input';

const NOW = Date.parse('2026-10-26T12:00:00Z');

const ada = (overrides: Record<string, unknown> = {}) => ({
  id: 'u1',
  privyDid: 'did:privy:ada',
  email: 'ada@example.com',
  photo: null,
  location: null,
  walletAddress: null,
  peopleId: null,
  role: 'USER',
  ...overrides,
});

interface Options {
  user?: Record<string, unknown>;
  // Who holds a username already.
  usernameOwner?: string;
  photoExists?: boolean;
  member?: boolean;
  person?: { id: string } | null;
}

// A stand-in for Prisma, Cloudinary and Privy: only the calls made, with
// every write kept.
const setup = (options: Options = {}) => {
  const writes: Array<{ op: string; args: unknown }> = [];
  const wallets: Array<string> = [];
  const record =
    (op: string, result: unknown = {}) =>
    async (args: unknown) => {
      writes.push({ op, args });
      return result;
    };
  const client = {
    user: {
      findUnique: async ({ where }: { where: Record<string, unknown> }) => {
        if ('username' in where) {
          return options.usernameOwner ? { id: options.usernameOwner } : null;
        }
        return ada(options.user);
      },
      update: record('user.update', { email: 'ada@example.com' }),
      updateMany: record('user.updateMany', { count: 1 }),
    },
    emailSettings: {
      deleteMany: record('emailSettings.deleteMany'),
      createMany: record('emailSettings.createMany'),
    },
    unsubscribedEmail: { deleteMany: record('unsubscribedEmail.deleteMany') },
    userSponsors: {
      findFirst: async () => (options.member ? { sponsorId: 's1' } : null),
    },
    people: {
      findUnique: async () => null,
      findFirst: async () => options.person ?? null,
    },
    $transaction: async (work: unknown) =>
      typeof work === 'function'
        ? (work as (tx: unknown) => Promise<unknown>)(client)
        : Promise.all(work as Array<Promise<unknown>>),
  };
  const layer = ProfileWrites.layer.pipe(
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
          ImageStore.ImageStore,
          ImageStore.ImageStore.of({
            folder: () => 'earn-pfp-dev',
            signUpload: () => Effect.die('unused'),
            exists: () => Effect.succeed(options.photoExists ?? true),
            ownerOf: () => Effect.die('unused'),
            destroy: () => Effect.die('unused'),
            fetchUrl: (url) => url ?? null,
          }),
        ),
        Layer.succeed(
          PrivyApi.PrivyApi,
          PrivyApi.PrivyApi.of({
            createSolanaWallet: (privyDid) =>
              Effect.sync(() => {
                wallets.push(privyDid);
                return 'So1anaWa11et';
              }),
          }),
        ),
      ),
    ),
  );
  const run = <A, E>(
    use: (
      writes: ProfileWrites.ProfileWrites['Service'],
    ) => Effect.Effect<A, E>,
  ) =>
    Effect.gen(function* () {
      yield* TestClock.setTime(NOW);
      return yield* ProfileWrites.ProfileWrites.use(use);
    }).pipe(Effect.provide(layer));
  const updates = () =>
    writes
      .filter((write) => write.op === 'user.update')
      .map((write) => (write.args as { data: Record<string, unknown> }).data);
  return { run, writes, wallets, updates };
};

const onboarding: ProfileBody = {
  username: 'ada-l',
  firstName: 'Ada',
  lastName: 'Lovelace',
  location: 'india',
  skills: [{ skills: 'Frontend', subskills: ['React'] }],
  github: '@ada',
  twitter: 'https://x.com/ada',
};

describe('ProfileWrites.complete', () => {
  it.effect('saves as Earn stores it and makes their wallet', () =>
    Effect.gen(function* () {
      const fake = setup();
      yield* fake.run((writes) => writes.complete('u1', onboarding));
      const [data] = fake.updates();
      assert.strictEqual(data?.isTalentFilled, true);
      assert.strictEqual(data?.walletAddress, 'So1anaWa11et');
      assert.strictEqual(data?.github, 'https://github.com/ada');
      assert.strictEqual(data?.twitter, 'https://x.com/ada');
      assert.strictEqual(data?.location, 'India');
      assert.deepStrictEqual(fake.wallets, ['did:privy:ada']);
      // Earn's five talent emails, on.
      const created = fake.writes.find(
        (write) => write.op === 'emailSettings.createMany',
      )?.args as { data: Array<{ category: string }> };
      assert.deepStrictEqual(
        created.data.map((row) => row.category),
        [
          'createListing',
          'commentOrLikeSubmission',
          'weeklyListingRoundup',
          'replyOrTagComment',
          'productAndNewsletter',
        ],
      );
    }),
  );

  it.effect('keeps an existing wallet', () =>
    Effect.gen(function* () {
      const fake = setup({ user: { walletAddress: 'Existing' } });
      yield* fake.run((writes) => writes.complete('u1', onboarding));
      assert.deepStrictEqual(fake.wallets, []);
      assert.strictEqual(fake.updates()[0]?.walletAddress, 'Existing');
    }),
  );

  it.effect('links a Superteam member by email', () =>
    Effect.gen(function* () {
      const fake = setup({ person: { id: 'p1' } });
      yield* fake.run((writes) => writes.complete('u1', onboarding));
      const link = fake.writes.find((write) => write.op === 'user.updateMany');
      assert.deepStrictEqual(link?.args, {
        where: { id: 'u1', email: 'ada@example.com' },
        data: { peopleId: 'p1' },
      });
    }),
  );

  it.effect('needs GitHub from developers and X from everyone else', () =>
    Effect.gen(function* () {
      const developer = yield* setup()
        .run((writes) =>
          writes.complete('u1', { ...onboarding, github: undefined }),
        )
        .pipe(Effect.flip);
      assert.deepStrictEqual(
        developer._tag === 'InvalidProfile' ? developer.errors : null,
        { github: ['Github is required'] },
      );
      const designer = yield* setup()
        .run((writes) =>
          writes.complete('u1', {
            ...onboarding,
            skills: [{ skills: 'Design', subskills: ['UI/UX Design'] }],
            twitter: '',
          }),
        )
        .pipe(Effect.flip);
      assert.deepStrictEqual(
        designer._tag === 'InvalidProfile' ? designer.errors : null,
        { twitter: ['X is required'] },
      );
    }),
  );

  it.effect(
    'refuses a taken username or a sanctioned country, writing nothing',
    () =>
      Effect.gen(function* () {
        const taken = setup({ usernameOwner: 'u2' });
        const error = yield* taken
          .run((writes) => writes.complete('u1', onboarding))
          .pipe(Effect.flip);
        assert.strictEqual(error._tag, 'InvalidProfile');
        assert.deepStrictEqual(taken.writes, []);
        const sanctioned = setup();
        const refused = yield* sanctioned
          .run((writes) =>
            writes.complete('u1', { ...onboarding, location: 'Iran' }),
          )
          .pipe(Effect.flip);
        assert.deepStrictEqual(
          refused._tag === 'InvalidProfile' ? Object.keys(refused.errors) : [],
          ['location'],
        );
        assert.deepStrictEqual(sanctioned.wallets, []);
      }),
  );

  it.effect('refuses a photo Earn didn’t store', () =>
    Effect.gen(function* () {
      const fake = setup({ photoExists: false });
      const error = yield* fake
        .run((writes) =>
          writes.complete('u1', {
            ...onboarding,
            photo:
              'https://res.cloudinary.com/x/image/upload/v1/earn-pfp/a.png',
          }),
        )
        .pipe(Effect.flip);
      assert.strictEqual(error._tag, 'PhotoMissing');
    }),
  );
});

describe('ProfileWrites.edit', () => {
  it.effect('starts the location cooldown only when they move', () =>
    Effect.gen(function* () {
      const moved = setup({ user: { location: 'India' } });
      yield* moved.run((writes) => writes.edit('u1', { location: 'Croatia' }));
      assert.deepStrictEqual(
        moved.updates()[0]?.locationUpdatedAt,
        new Date(NOW),
      );
      const first = setup();
      yield* first.run((writes) => writes.edit('u1', { location: 'Croatia' }));
      assert.isUndefined(first.updates()[0]?.locationUpdatedAt);
    }),
  );

  it.effect('reads socials from their URLs and clears unrecognised ones', () =>
    Effect.gen(function* () {
      const fake = setup();
      yield* fake.run((writes) =>
        writes.edit('u1', {
          github: 'https://github.com/ada',
          twitter: 'not a url',
          interests: ['DeFi'],
        }),
      );
      const [data] = fake.updates();
      assert.strictEqual(data?.github, 'https://github.com/ada');
      assert.strictEqual(data?.twitter, '');
      assert.strictEqual(data?.interests, '["DeFi"]');
    }),
  );
});

describe('ProfileWrites.account', () => {
  it.effect('switches only to a sponsor they belong to', () =>
    Effect.gen(function* () {
      const outsider = yield* setup()
        .run((writes) => writes.account('u1', { currentSponsorId: 's1' }))
        .pipe(Effect.asVoid, Effect.flip);
      assert.strictEqual(outsider._tag, 'SponsorForbidden');
      const member = setup({ member: true });
      yield* member.run((writes) =>
        writes.account('u1', { currentSponsorId: 's1', hackathonId: 'h1' }),
      );
      // hackathonId is God mode's alone.
      assert.deepStrictEqual(member.updates()[0], { currentSponsorId: 's1' });
      const god = setup({ user: { role: 'GOD' } });
      yield* god.run((writes) =>
        writes.account('u1', { currentSponsorId: 's9', hackathonId: 'h1' }),
      );
      assert.deepStrictEqual(god.updates()[0], {
        currentSponsorId: 's9',
        hackathonId: 'h1',
      });
    }),
  );

  it.effect('refuses an empty update', () =>
    Effect.gen(function* () {
      const error = yield* setup()
        .run((writes) => writes.account('u1', {}))
        .pipe(Effect.asVoid, Effect.flip);
      assert.strictEqual(error._tag, 'NothingToUpdate');
    }),
  );
});

describe('ProfileWrites.emailSettings', () => {
  it.effect('replaces their categories and undoes an unsubscribe', () =>
    Effect.gen(function* () {
      const fake = setup();
      yield* fake.run((writes) =>
        writes.emailSettings('u1', ['createListing']),
      );
      assert.deepStrictEqual(
        fake.writes.map((write) => write.op),
        [
          'emailSettings.deleteMany',
          'emailSettings.createMany',
          'unsubscribedEmail.deleteMany',
        ],
      );
    }),
  );
});
