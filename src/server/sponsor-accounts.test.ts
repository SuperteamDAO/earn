import { assert, describe, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';

import * as Database from '@/server/database';
import * as SponsorAccounts from '@/server/sponsor-accounts';
import * as SponsorIntegrations from '@/server/sponsor-integrations';
import type * as Users from '@/server/users';

const LOGO =
  'https://res.cloudinary.com/earn/image/upload/v1712/earn-sponsor/acme.png';

const body = (overrides: Record<string, unknown> = {}) => ({
  name: 'Acme',
  slug: 'Acme-Labs',
  bio: 'We build things',
  logo: LOGO,
  industry: 'DeFi, Infrastructure',
  url: 'https://acme.xyz',
  twitter: 'https://x.com/acme_labs',
  entityName: 'Acme Inc.',
  location: 'India',
  ...overrides,
});

const writer: Users.Writer = { userId: 'u1', privyDid: 'did:privy:u1' };
const sponsorWriter: Users.SponsorWriter = {
  ...writer,
  sponsorId: 's1',
  role: 'USER',
  god: false,
  hackathonId: null,
};

interface Options {
  user?: { currentSponsorId: string | null; role: string } | null;
  // What Cloudinary says about the logo; 'error' when it can't.
  logo?: boolean | 'error';
  // The write fails on a unique constraint.
  unique?: boolean;
  before?: { name: string; logo: string | null };
}

// A stand-in for Prisma: only the calls the service makes, with every write
// recorded.
function fake(options: Options = {}) {
  const writes: Array<{ op: string; args: unknown }> = [];
  const renames: Array<[string, string]> = [];
  const record =
    (op: string, result: (args: never) => unknown = () => ({})) =>
    async (args: never) => {
      if (options.unique && op.endsWith('sponsors.create')) {
        throw Object.assign(new Error('unique'), { code: 'P2002' });
      }
      if (options.unique && op === 'sponsors.update') {
        throw Object.assign(new Error('unique'), { code: 'P2002' });
      }
      writes.push({ op, args });
      return result(args);
    };
  const client = {
    user: {
      findUnique: async () =>
        'user' in options
          ? options.user
          : { currentSponsorId: null, role: 'USER' },
      update: record('user.update'),
    },
    sponsors: {
      findUnique: async () => options.before ?? { name: 'Acme', logo: 'old' },
      create: record('sponsors.create', ({ data }: { data: object }) => ({
        id: 's-new',
        ...data,
      })),
      update: record('sponsors.update', ({ data }: { data: object }) => ({
        id: 's1',
        ...data,
      })),
      findMany: async () => [],
    },
    userSponsors: { create: record('userSponsors.create') },
    emailSettings: {
      deleteMany: record('emailSettings.deleteMany'),
      create: record('emailSettings.create'),
    },
    $transaction: async (run: (tx: unknown) => Promise<unknown>) => run(client),
  };
  const layer = SponsorAccounts.layer.pipe(
    Layer.provide(
      Layer.mergeAll(
        Layer.succeed(
          Database.Database,
          Database.Database.of({
            query: (operation, run) =>
              Effect.tryPromise({
                try: () => run(client as never),
                catch: (cause) =>
                  new Database.DatabaseError({ operation, cause }),
              }),
          }),
        ),
        Layer.succeed(
          SponsorIntegrations.SponsorIntegrations,
          SponsorIntegrations.SponsorIntegrations.of({
            imageExists: () =>
              options.logo === 'error'
                ? Effect.fail(new SponsorIntegrations.ImageCheckFailed({}))
                : Effect.succeed(options.logo ?? true),
            renameGdpSponsor: (from, to) =>
              Effect.sync(() => {
                renames.push([from, to]);
              }),
          }),
        ),
      ),
    ),
  );
  return { layer, writes, renames };
}

const failureTag = <A, E extends { _tag: string }>(exit: Exit.Exit<A, E>) =>
  Exit.isFailure(exit)
    ? Option.getOrUndefined(Exit.findErrorOption(exit))?._tag
    : undefined;

describe('sponsorFields', () => {
  it('normalizes as Earn stores a sponsor', () => {
    const fields = Option.getOrThrow(SponsorAccounts.sponsorFields(body()));
    assert.strictEqual(fields.slug, 'acme-labs');
    assert.strictEqual(fields.twitter, 'https://x.com/acme_labs');
    assert.notProperty(fields, 'extra');
  });

  it('refuses what Earn’s schema refuses', () => {
    const refused = [
      body({ name: '' }),
      body({ name: '<b>Acme</b>' }),
      body({ slug: 'acme labs' }),
      body({ bio: 'x'.repeat(181) }),
      body({ logo: '' }),
      body({ industry: '' }),
      body({ url: 'not a url' }),
      // A bare handle isn't an X link, so no handle is read from it.
      body({ twitter: 'acme' }),
      body({ twitter: 'https://x.com/a-very-long-handle-indeed' }),
      body({ twitter: undefined }),
      body({ entityName: '' }),
      body({ location: '' }),
      body({ location: 'North Korea' }),
      body({ name: 42 }),
    ];
    for (const input of refused) {
      assert.isTrue(Option.isNone(SponsorAccounts.sponsorFields(input)));
    }
  });
});

const run = <A, E>(
  layer: Layer.Layer<SponsorAccounts.SponsorAccounts>,
  use: (
    accounts: SponsorAccounts.SponsorAccounts['Service'],
  ) => Effect.Effect<A, E>,
) =>
  SponsorAccounts.SponsorAccounts.use(use).pipe(
    Effect.provide(layer),
    Effect.exit,
  );

describe('SponsorAccounts.create', () => {
  it.effect('makes them its admin and switches them to it', () =>
    Effect.gen(function* () {
      const { layer, writes } = fake();
      const exit = yield* run(layer, (accounts) =>
        accounts.create(writer, body()),
      );
      assert.isTrue(Exit.isSuccess(exit));
      const ops = writes.map((write) => write.op);
      assert.deepStrictEqual(ops.slice(0, 3), [
        'sponsors.create',
        'userSponsors.create',
        'user.update',
      ]);
      assert.deepInclude(writes[1]?.args as object, {
        data: { userId: 'u1', sponsorId: 's-new', role: 'ADMIN' },
      });
      assert.deepInclude(writes[2]?.args as object, {
        where: { id: 'u1' },
        data: { currentSponsorId: 's-new' },
      });
      const categories = writes
        .filter((write) => write.op === 'emailSettings.create')
        .map(
          (write) =>
            (write.args as { data: { category: string } }).data.category,
        );
      assert.deepStrictEqual(categories, [
        'commentSponsor',
        'deadlineSponsor',
        'productAndNewsletter',
        'replyOrTagComment',
      ]);
    }),
  );

  it.effect('refuses a second sponsor, except in God mode', () =>
    Effect.gen(function* () {
      const member = fake({ user: { currentSponsorId: 's1', role: 'USER' } });
      const refused = yield* run(member.layer, (accounts) =>
        accounts.create(writer, body()),
      );
      assert.strictEqual(failureTag(refused), 'AlreadySponsor');
      assert.lengthOf(member.writes, 0);

      const god = fake({ user: { currentSponsorId: 's1', role: 'GOD' } });
      const made = yield* run(god.layer, (accounts) =>
        accounts.create(writer, body()),
      );
      assert.isTrue(Exit.isSuccess(made));
    }),
  );

  it.effect('refuses invalid data, a missing account and a missing logo', () =>
    Effect.gen(function* () {
      const invalid = fake();
      assert.strictEqual(
        failureTag(
          yield* run(invalid.layer, (accounts) =>
            accounts.create(writer, body({ url: '' })),
          ),
        ),
        'InvalidSponsor',
      );
      const noUser = fake({ user: null });
      assert.strictEqual(
        failureTag(
          yield* run(noUser.layer, (accounts) =>
            accounts.create(writer, body()),
          ),
        ),
        'UserNotFound',
      );
      const noLogo = fake({ logo: false });
      assert.strictEqual(
        failureTag(
          yield* run(noLogo.layer, (accounts) =>
            accounts.create(writer, body()),
          ),
        ),
        'LogoMissing',
      );
      for (const { writes } of [invalid, noUser, noLogo]) {
        assert.lengthOf(writes, 0);
      }
    }),
  );

  it.effect('creates without a logo Cloudinary can’t vouch for', () =>
    Effect.gen(function* () {
      const { layer, writes } = fake({ logo: 'error' });
      yield* run(layer, (accounts) => accounts.create(writer, body()));
      const args = writes[0]?.args as { data: { logo?: string } } | undefined;
      assert.isDefined(args);
      assert.isUndefined(args.data.logo);
    }),
  );

  it.effect('reports a taken name or slug', () =>
    Effect.gen(function* () {
      const { layer } = fake({ unique: true });
      const exit = yield* run(layer, (accounts) =>
        accounts.create(writer, body()),
      );
      assert.strictEqual(failureTag(exit), 'SponsorTaken');
    }),
  );
});

describe('SponsorAccounts.edit', () => {
  it.effect('saves the current sponsor and renames it in Airtable', () =>
    Effect.gen(function* () {
      const { layer, writes, renames } = fake({
        before: { name: 'Old Acme', logo: 'old' },
      });
      const exit = yield* run(layer, (accounts) =>
        accounts.edit(sponsorWriter, body()),
      );
      assert.isTrue(Exit.isSuccess(exit));
      assert.deepInclude(writes[0]?.args as object, { where: { id: 's1' } });
      assert.deepStrictEqual(renames, [['Old Acme', 'Acme']]);
    }),
  );

  it.effect('leaves Airtable alone when the name stays', () =>
    Effect.gen(function* () {
      const { layer, renames } = fake();
      yield* run(layer, (accounts) => accounts.edit(sponsorWriter, body()));
      assert.lengthOf(renames, 0);
    }),
  );

  it.effect('keeps the stored logo when Cloudinary can’t say', () =>
    Effect.gen(function* () {
      const { layer, writes } = fake({ logo: 'error' });
      yield* run(layer, (accounts) => accounts.edit(sponsorWriter, body()));
      const args = writes[0]?.args as { data: { logo: string } } | undefined;
      assert.strictEqual(args?.data.logo, 'old');
    }),
  );

  it.effect('refuses a logo that isn’t in storage, and a taken slug', () =>
    Effect.gen(function* () {
      const noLogo = fake({ logo: false });
      assert.strictEqual(
        failureTag(
          yield* run(noLogo.layer, (accounts) =>
            accounts.edit(sponsorWriter, body()),
          ),
        ),
        'LogoMissing',
      );
      const taken = fake({ unique: true });
      assert.strictEqual(
        failureTag(
          yield* run(taken.layer, (accounts) =>
            accounts.edit(sponsorWriter, body()),
          ),
        ),
        'SponsorTaken',
      );
    }),
  );
});
