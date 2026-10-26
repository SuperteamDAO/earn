import { assert, describe, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import * as Database from '@/server/database';
import * as ImageStore from '@/server/image-store';
import * as OgImages from '@/server/og-images';
import * as RateLimits from '@/server/rate-limits';

const layerFor = (record: unknown) => {
  const writes: Array<unknown> = [];
  const table = {
    findUnique: async () => record,
    updateMany: async (change: unknown) => {
      writes.push(change);
      return { count: 1 };
    },
  };
  const layer = OgImages.layer.pipe(
    Layer.provide(
      Layer.mergeAll(
        Layer.succeed(
          Database.Database,
          Database.Database.of({
            query: (_operation, run) =>
              Effect.promise(() =>
                run({ submission: table, poW: table } as never),
              ),
          }),
        ),
        Layer.succeed(
          ImageStore.ImageStore,
          ImageStore.ImageStore.of({
            folder: () => '',
            signUpload: () => Effect.die('unused'),
            exists: () => Effect.die('unused'),
            ownerOf: () => Effect.die('unused'),
            destroy: () => Effect.die('unused'),
            fetchUrl: (url) => url ?? null,
          }),
        ),
        Layer.succeed(
          RateLimits.RateLimits,
          RateLimits.RateLimits.of({ check: () => Effect.void }),
        ),
      ),
    ),
  );
  return { layer, writes };
};

const update = (record: unknown) => {
  const { layer, writes } = layerFor(record);
  return OgImages.OgImages.use((og) => og.update('u1', 'pow', 'p1')).pipe(
    Effect.provide(layer),
    Effect.map((imageUrl) => ({ imageUrl, writes })),
  );
};

describe('OgImages.update', () => {
  it.effect('keeps an image already read, and needs a link to read one', () =>
    Effect.gen(function* () {
      const exists = yield* update({
        link: 'https://example.com',
        ogImage: 'https://img',
      }).pipe(Effect.flip);
      assert.strictEqual(exists._tag, 'OgImageExists');
      const noLink = yield* update({ link: '', ogImage: null }).pipe(
        Effect.flip,
      );
      assert.strictEqual(noLink._tag, 'OgNoSource');
      const missing = yield* update(null).pipe(Effect.flip);
      assert.strictEqual(missing._tag, 'OgRecordNotFound');
    }),
  );

  it.effect('stores error for a page it may not fetch', () =>
    Effect.gen(function* () {
      // A private address is never fetched.
      const { imageUrl, writes } = yield* update({
        link: 'http://127.0.0.1/',
        ogImage: 'error',
      });
      assert.strictEqual(imageUrl, 'error');
      assert.deepStrictEqual(writes, [
        {
          where: { id: 'p1', OR: [{ ogImage: null }, { ogImage: 'error' }] },
          data: { ogImage: 'error' },
        },
      ]);
    }),
  );
});

describe('ogImageValue', () => {
  it('takes the first image, else error', () => {
    assert.strictEqual(OgImages.ogImageValue('error'), 'error');
    assert.strictEqual(OgImages.ogImageValue({ images: [] }), 'error');
    assert.strictEqual(
      OgImages.ogImageValue({ images: [{ url: 'https://a' }] }),
      'https://a',
    );
  });
});
