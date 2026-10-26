import { assert, describe, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { TestClock } from 'effect/testing';

import * as Database from '@/server/database';
import * as ListingLikes from '@/server/listing-likes';
import { toggledLikes } from '@/server/listing-likes';

describe('toggledLikes', () => {
  it('adds their like, or takes it back', () => {
    assert.deepStrictEqual(toggledLikes(null, 'u1', 5), [
      { id: 'u1', date: 5 },
    ]);
    assert.deepStrictEqual(toggledLikes([{ id: 'u2', date: 1 }], 'u1', 5), [
      { id: 'u2', date: 1 },
      { id: 'u1', date: 5 },
    ]);
    assert.deepStrictEqual(
      toggledLikes(
        [
          { id: 'u2', date: 1 },
          { id: 'u1', date: 2 },
        ],
        'u1',
        5,
      ),
      [{ id: 'u2', date: 1 }],
    );
  });
});

describe('ListingLikes.toggleSubmission', () => {
  it.effect('saves the likes and their count', () =>
    Effect.gen(function* () {
      yield* TestClock.setTime(1000);
      const updates: Array<unknown> = [];
      const client = {
        submission: {
          findFirst: async () => ({ like: [{ id: 'u2', date: 1 }] }),
          update: async (args: unknown) => {
            updates.push(args);
            return { id: 's1' };
          },
        },
      };
      const layer = ListingLikes.layer.pipe(
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
      const liked = yield* ListingLikes.ListingLikes.use((likes) =>
        likes.toggleSubmission('u1', 's1'),
      ).pipe(Effect.provide(layer));
      assert.isTrue(liked);
      assert.deepStrictEqual(updates, [
        {
          where: { id: 's1' },
          data: {
            like: [
              { id: 'u2', date: 1 },
              { id: 'u1', date: 1000 },
            ],
            likeCount: 2,
          },
          select: { id: true },
        },
      ]);
    }),
  );
});
