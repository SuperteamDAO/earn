import { assert, describe, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Redacted from 'effect/Redacted';
import { afterEach, vi } from 'vitest';

import * as AppConfig from '@/server/app-config';
import * as Database from '@/server/database';
import { testConfig } from '@/server/test-config';
import * as XAccounts from '@/server/x-accounts';

const config = {
  ...testConfig,
  x: { clientId: 'client', clientSecret: Redacted.make('secret') },
};

// X's token and profile endpoints, answering as `username`.
const stubX = (username: string) => {
  const calls: Array<{ url: string; body: string }> = [];
  vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
    calls.push({
      url,
      body: typeof init.body === 'string' ? init.body : '',
    });
    const body = url.endsWith('/oauth2/token')
      ? { access_token: 'token' }
      : { data: { username } };
    return new Response(JSON.stringify(body), { status: 200 });
  });
  return calls;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

// A stand-in for Prisma's transaction: a user row with linked handles.
const setup = (linked: unknown, exists = true) => {
  const writes: Array<unknown> = [];
  const tx = {
    $queryRaw: async () => (exists ? [{ id: 'u1' }] : []),
    user: {
      findUniqueOrThrow: async () => ({ linkedTwitter: linked }),
      update: async ({ data }: { data: unknown }) => {
        writes.push(data);
        return {};
      },
    },
  };
  const client = {
    $transaction: async (run: (transaction: typeof tx) => Promise<unknown>) =>
      run(tx),
  };
  const layer = XAccounts.layer.pipe(
    Layer.provide(
      Layer.mergeAll(
        Layer.succeed(AppConfig.AppConfig, config),
        Layer.succeed(
          Database.Database,
          Database.Database.of({
            query: (_operation, run) =>
              Effect.promise(() => run(client as never)),
          }),
        ),
      ),
    ),
  );
  return { layer, writes };
};

const link = (layer: Layer.Layer<XAccounts.XAccounts>) =>
  XAccounts.XAccounts.use((x) =>
    x.link('did:privy:u1', 'code', 'verifier'),
  ).pipe(Effect.provide(layer));

describe('XAccounts.authorize', () => {
  it.effect('sends them to X with PKCE, back to the registered callback', () =>
    Effect.gen(function* () {
      const { layer } = setup([]);
      const trip = yield* XAccounts.XAccounts.use((x) => x.authorize).pipe(
        Effect.provide(layer),
      );
      const url = new URL(trip.url);
      assert.strictEqual(
        url.searchParams.get('redirect_uri'),
        'http://localhost:3000/api/auth/callback/twitter',
      );
      assert.strictEqual(url.searchParams.get('state'), trip.state);
      assert.strictEqual(url.searchParams.get('code_challenge_method'), 'S256');
    }),
  );
});

describe('XAccounts.link', () => {
  it.effect('adds the handle once, lower-cased without @', () =>
    Effect.gen(function* () {
      const calls = stubX('@Ada_L');
      const fresh = setup(['old']);
      assert.strictEqual(yield* link(fresh.layer), 'ada_l');
      assert.deepStrictEqual(fresh.writes, [
        { linkedTwitter: ['old', 'ada_l'] },
      ]);
      assert.include(calls[0]?.body ?? '', 'code_verifier=verifier');

      const again = setup(['ada_l']);
      yield* link(again.layer);
      assert.deepStrictEqual(again.writes, []);

      // Whatever was stored before, a list starts.
      const empty = setup(null);
      yield* link(empty.layer);
      assert.deepStrictEqual(empty.writes, [{ linkedTwitter: ['ada_l'] }]);
    }),
  );

  it.effect('refuses without an Earn account or when X says no', () =>
    Effect.gen(function* () {
      stubX('ada');
      const missing = yield* link(setup([], false).layer).pipe(Effect.flip);
      assert.deepStrictEqual(
        missing,
        new XAccounts.XRefused({ reason: 'account' }),
      );
      vi.stubGlobal('fetch', async () => new Response('{}', { status: 400 }));
      const denied = yield* link(setup([]).layer).pipe(Effect.flip);
      assert.deepStrictEqual(
        denied,
        new XAccounts.XRefused({ reason: 'denied' }),
      );
    }),
  );
});
