import { assert, describe, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import * as Database from '@/server/database';
import * as TalentDirectory from '@/server/talent-directory';

const setup = (options: {
  owner?: string;
  blocked?: boolean;
  taken?: number;
}) => {
  let lookups = 0;
  const client = {
    user: {
      findUnique: async ({ where }: { where: Record<string, unknown> }) => {
        if ('privyDid' in where) return { isBlocked: !!options.blocked };
        lookups += 1;
        if (options.taken !== undefined) {
          return lookups <= options.taken ? { id: 'someone' } : null;
        }
        return options.owner ? { id: options.owner } : null;
      },
      findMany: async () => [{ id: 'u3', username: 'ada' }],
    },
  };
  const layer = TalentDirectory.layer.pipe(
    Layer.provide(
      Layer.succeed(
        Database.Database,
        Database.Database.of({
          query: (_operation, run) =>
            Effect.promise(() => run(client as never)),
        }),
      ),
    ),
  );
  return <A, E>(
    use: (
      directory: TalentDirectory.TalentDirectory['Service'],
    ) => Effect.Effect<A, E>,
  ) => TalentDirectory.TalentDirectory.use(use).pipe(Effect.provide(layer));
};

describe('TalentDirectory.usernameAvailable', () => {
  it.effect('is free when nobody, or they themselves, has it', () =>
    Effect.gen(function* () {
      assert.isTrue(yield* setup({})((d) => d.usernameAvailable('ada', 'u1')));
      assert.isTrue(
        yield* setup({ owner: 'u1' })((d) => d.usernameAvailable('ada', 'u1')),
      );
      assert.isFalse(
        yield* setup({ owner: 'u2' })((d) => d.usernameAvailable('ada', 'u1')),
      );
    }),
  );
});

describe('TalentDirectory.randomUsername', () => {
  it.effect('starts with their first name and skips taken ones', () =>
    Effect.gen(function* () {
      const username = yield* setup({ taken: 3 })((d) =>
        d.randomUsername('Ada'),
      );
      assert.match(username ?? '', /^ada-[a-z0-9_-]+$/);
    }),
  );

  it.effect('gives up after ten taken tries', () =>
    Effect.gen(function* () {
      assert.isNull(
        yield* setup({ taken: 10 })((d) => d.randomUsername('Ada')),
      );
    }),
  );
});

describe('TalentDirectory.search', () => {
  it.effect('refuses blocked accounts', () =>
    Effect.gen(function* () {
      const error = yield* setup({ blocked: true })((d) =>
        d.search('ad', 5, 'did:privy:x'),
      ).pipe(Effect.flip);
      assert.strictEqual(error._tag, 'SearchBlocked');
      const found = yield* setup({})((d) => d.search('ad', 5, null));
      assert.strictEqual(found.length, 1);
    }),
  );
});
