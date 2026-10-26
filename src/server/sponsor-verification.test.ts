import { assert, describe, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';

import * as Database from '@/server/database';
import * as Earncognito from '@/server/earncognito';
import * as SponsorVerification from '@/server/sponsor-verification';
import type * as Users from '@/server/users';

const writer: Users.SponsorWriter = {
  userId: 'u1',
  privyDid: 'did:privy:u1',
  sponsorId: 's1',
  role: 'ADMIN',
  god: false,
  hackathonId: null,
};

const body = (overrides: Record<string, unknown> = {}) => ({
  superteamLead: 'Kash',
  superteamName: 'Superteam India',
  fundingSource: 'VC funded',
  telegram: 'https://t.me/acme_ops',
  commitToDeadline: 'yes',
  listingId: 'l1',
  ...overrides,
});

interface Options {
  listing?: { status: string } | null;
  earncognitoDown?: boolean;
}

function fake(options: Options = {}) {
  const lookups: Array<unknown> = [];
  const updates: Array<unknown> = [];
  const posts: Array<{ path: string; body: unknown }> = [];
  const client = {
    bounties: {
      findFirst: async (args: unknown) => {
        lookups.push(args);
        return 'listing' in options ? options.listing : { status: 'VERIFYING' };
      },
    },
    sponsors: {
      update: async (args: { data: object }) => {
        updates.push(args);
        return { id: 's1', ...args.data };
      },
    },
  };
  const layer = SponsorVerification.layer.pipe(
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
          Earncognito.Earncognito,
          Earncognito.Earncognito.of({
            post: (path, payload) =>
              Effect.suspend(() => {
                posts.push({ path, body: payload });
                return options.earncognitoDown
                  ? Effect.fail(new Earncognito.EarncognitoError({ path }))
                  : Effect.succeed(null);
              }),
          }),
        ),
      ),
    ),
  );
  return { layer, lookups, updates, posts };
}

const submit = (
  layer: Layer.Layer<SponsorVerification.SponsorVerification>,
  input: Record<string, unknown>,
) =>
  SponsorVerification.SponsorVerification.use((verification) =>
    verification.submit(writer, input),
  ).pipe(Effect.provide(layer), Effect.exit);

const failureTag = <A, E extends { _tag: string }>(exit: Exit.Exit<A, E>) =>
  Exit.isFailure(exit)
    ? Option.getOrUndefined(Exit.findErrorOption(exit))?._tag
    : undefined;

describe('SponsorVerification.submit', () => {
  it.effect('keeps the answers and asks earncognito to vouch', () =>
    Effect.gen(function* () {
      const { layer, lookups, updates, posts } = fake();
      const exit = yield* submit(layer, body({ extra: 'dropped' }));
      assert.isTrue(Exit.isSuccess(exit));
      // Only the sponsor's own listing.
      assert.deepInclude(lookups[0] as object, {
        where: { id: 'l1', sponsorId: 's1' },
      });
      assert.deepStrictEqual(updates[0], {
        where: { id: 's1' },
        data: {
          verificationInfo: {
            superteamLead: 'Kash',
            superteamName: 'Superteam India',
            fundingSource: 'VC funded',
            telegram: 'https://t.me/acme_ops',
            commitToDeadline: 'yes',
            listingId: 'l1',
          },
        },
      });
      assert.deepStrictEqual(posts, [
        {
          path: '/telegram/verify-listing/dm-st',
          body: {
            listingId: 'l1',
            superteamName: 'Superteam India',
            superteamLead: 'Kash',
          },
        },
        { path: '/telegram/verify-listing', body: { listingId: 'l1' } },
      ]);
    }),
  );

  it.effect('succeeds when earncognito is down', () =>
    Effect.gen(function* () {
      const { layer, posts } = fake({ earncognitoDown: true });
      assert.isTrue(Exit.isSuccess(yield* submit(layer, body())));
      assert.lengthOf(posts, 2);
    }),
  );

  it.effect('refuses invalid answers before touching anything', () =>
    Effect.gen(function* () {
      for (const input of [
        body({ superteamLead: '' }),
        body({ fundingSource: undefined }),
        body({ telegram: 'acme_ops' }),
        body({ telegram: 'https://t.me/abc' }),
        body({ commitToDeadline: 'maybe' }),
        body({ listingId: 7 }),
      ]) {
        const { layer, lookups, posts } = fake();
        assert.strictEqual(
          failureTag(yield* submit(layer, input)),
          'InvalidVerification',
        );
        assert.lengthOf(lookups, 0);
        assert.lengthOf(posts, 0);
      }
      // No Superteam named is allowed.
      const { layer } = fake();
      assert.isTrue(
        Exit.isSuccess(yield* submit(layer, body({ superteamName: null }))),
      );
    }),
  );

  it.effect('only for its own listing awaiting verification', () =>
    Effect.gen(function* () {
      const missing = fake({ listing: null });
      assert.strictEqual(
        failureTag(yield* submit(missing.layer, body())),
        'ListingNotFound',
      );
      const live = fake({ listing: { status: 'OPEN' } });
      assert.strictEqual(
        failureTag(yield* submit(live.layer, body())),
        'NotVerifying',
      );
      for (const { updates, posts } of [missing, live]) {
        assert.lengthOf(updates, 0);
        assert.lengthOf(posts, 0);
      }
    }),
  );
});
