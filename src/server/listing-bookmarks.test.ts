import { assert, describe, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import * as Database from '@/server/database';
import * as ListingBookmarks from '@/server/listing-bookmarks';

interface Options {
  viewer?: { id: string; isBlocked: boolean } | null;
  existing?: { id: string; isArchived: boolean } | null;
}

const setup = (options: Options = {}) => {
  const writes: Array<{ call: string; args: unknown }> = [];
  const select = (args: unknown) => {
    writes.push({ call: 'write', args });
    return { id: 'b1', bountyId: 'l1', userId: 'u1', isArchived: false };
  };
  const client = {
    user: {
      findUnique: async () =>
        'viewer' in options ? options.viewer : { id: 'u1', isBlocked: false },
    },
    subscribeBounty: {
      findMany: async () => [
        { bountyId: 'l1', userId: 'u1' },
        { bountyId: 'l1', userId: 'u2' },
      ],
      findFirst: async () => options.existing ?? null,
      update: async (args: unknown) => {
        writes.push({ call: 'update', args });
        return select(args);
      },
      create: async (args: unknown) => {
        writes.push({ call: 'create', args });
        return select(args);
      },
    },
  };
  const layer = ListingBookmarks.layer.pipe(
    Layer.provide(
      Layer.succeed(
        Database.Database,
        Database.Database.of({
          query: (_operation, run) =>
            // oxlint-disable-next-line typescript/no-unsafe-type-assertion
            Effect.promise(() => run(client as never)),
        }),
      ),
    ),
  );
  return { layer, writes };
};

const run = <A, E>(
  layer: Layer.Layer<ListingBookmarks.ListingBookmarks>,
  use: (
    bookmarks: ListingBookmarks.ListingBookmarks['Service'],
  ) => Effect.Effect<A, E>,
) => ListingBookmarks.ListingBookmarks.use(use).pipe(Effect.provide(layer));

describe('ListingBookmarks.summary', () => {
  it.effect('counts bookmarks and whether the viewer has one', () =>
    Effect.gen(function* () {
      const { layer } = setup();
      assert.deepStrictEqual(
        yield* run(layer, (bookmarks) => bookmarks.summary('l1', 'did:u1')),
        { count: 2, bookmarked: true },
      );
      assert.deepStrictEqual(
        yield* run(layer, (bookmarks) => bookmarks.summary('l1', null)),
        { count: 2, bookmarked: false },
      );
    }),
  );

  it.effect('treats a blocked viewer as signed out', () =>
    Effect.gen(function* () {
      const { layer } = setup({ viewer: { id: 'u1', isBlocked: true } });
      assert.deepStrictEqual(
        yield* run(layer, (bookmarks) => bookmarks.summary('l1', 'did:u1')),
        { count: 2, bookmarked: false },
      );
    }),
  );
});

describe('ListingBookmarks.statusList', () => {
  it.effect('blanks everyone else’s id', () =>
    Effect.gen(function* () {
      const { layer } = setup();
      assert.deepStrictEqual(
        yield* run(layer, (bookmarks) => bookmarks.statusList('l1', 'did:u1')),
        [
          { bountyId: 'l1', userId: 'u1' },
          { bountyId: 'l1', userId: '' },
        ],
      );
    }),
  );

  it.effect('refuses a blocked viewer', () =>
    Effect.gen(function* () {
      const { layer } = setup({ viewer: { id: 'u1', isBlocked: true } });
      const error = yield* Effect.flip(
        run(layer, (bookmarks) => bookmarks.statusList('l1', 'did:u1')),
      );
      assert.strictEqual(error._tag, 'BookmarksBlocked');
    }),
  );
});

describe('ListingBookmarks.toggle', () => {
  it.effect('creates a bookmark the first time', () =>
    Effect.gen(function* () {
      const { layer, writes } = setup();
      yield* run(layer, (bookmarks) => bookmarks.toggle('u1', 'l1'));
      assert.strictEqual(writes[0]?.call, 'create');
      assert.deepInclude(writes[0]?.args, {
        data: { bountyId: 'l1', userId: 'u1' },
      });
    }),
  );

  it.effect('flips an existing one', () =>
    Effect.gen(function* () {
      const { layer, writes } = setup({
        existing: { id: 'b1', isArchived: false },
      });
      yield* run(layer, (bookmarks) => bookmarks.toggle('u1', 'l1'));
      assert.strictEqual(writes[0]?.call, 'update');
      assert.deepInclude(writes[0]?.args, {
        where: { id: 'b1' },
        data: { isArchived: true },
      });
    }),
  );
});
