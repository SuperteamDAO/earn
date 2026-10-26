import { assert, describe, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { TestClock } from 'effect/testing';

import * as Database from '@/server/database';
import * as ImageStore from '@/server/image-store';
import * as ImageUploads from '@/server/image-uploads';

const PHOTO =
  'https://res.cloudinary.com/earn/image/upload/v1/earn-pfp-dev/mine.webp';

interface Options {
  user?: unknown;
  bounty?: { id: string; title: string } | null;
  tranches?: Array<Record<string, unknown>>;
  owner?: string | null;
  destroyed?: boolean;
}

const user = (overrides: Record<string, unknown> = {}) => ({
  photo: PHOTO,
  currentSponsorId: null,
  currentSponsor: null,
  UserSponsors: [],
  ...overrides,
});

// Stand-ins for Prisma and Cloudinary: only the calls the service makes.
const setup = (options: Options = {}) => {
  const destroyed: Array<string> = [];
  const client = {
    user: {
      findUnique: async () => ('user' in options ? options.user : user()),
    },
    bounties: { findFirst: async () => options.bounty ?? null },
    grantTranche: { findMany: async () => options.tranches ?? [] },
  };
  const layer = ImageUploads.layer.pipe(
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
            folder: (source) =>
              source === 'user' ? 'earn-pfp-dev' : `${source}-dev`,
            signUpload: (source, ownerId) =>
              Effect.succeed({
                signature: 'sig',
                timestamp: 1,
                cloudName: 'earn',
                apiKey: 'key',
                folder: `${source}-dev`,
                context: `owner_id=${ownerId}`,
              }),
            exists: () => Effect.succeed(true),
            ownerOf: () => Effect.succeed(options.owner ?? null),
            destroy: (publicId) =>
              Effect.sync(() => {
                destroyed.push(publicId);
                return options.destroyed ?? true;
              }),
            fetchUrl: (url) => url ?? null,
          }),
        ),
      ),
    ),
  );
  return { layer, destroyed };
};

const remove = (options: Options, request: ImageUploads.DeleteRequest) => {
  const { layer, destroyed } = setup(options);
  return ImageUploads.ImageUploads.use((uploads) =>
    uploads.remove('u1', request),
  ).pipe(Effect.as(destroyed), Effect.provide(layer));
};

describe('ImageUploads.remove', () => {
  it.effect('deletes their saved photo, or one they uploaded', () =>
    Effect.gen(function* () {
      const saved = yield* remove(
        {},
        { publicId: 'earn-pfp-dev/mine', source: 'user' },
      );
      assert.deepStrictEqual(saved, ['earn-pfp-dev/mine']);
      const uploaded = yield* remove(
        { owner: 'u1' },
        { publicId: 'earn-pfp-dev/new', source: 'user' },
      );
      assert.deepStrictEqual(uploaded, ['earn-pfp-dev/new']);
    }),
  );

  it.effect('refuses someone else’s photo and other folders', () =>
    Effect.gen(function* () {
      const other = yield* remove(
        { owner: 'u2' },
        { publicId: 'earn-pfp-dev/theirs', source: 'user' },
      ).pipe(Effect.flip);
      assert.deepStrictEqual(
        other,
        new ImageUploads.ImageForbidden({ reason: 'userPhoto' }),
      );
      const folder = yield* remove(
        {},
        { publicId: 'earn-sponsor-dev/mine', source: 'user' },
      ).pipe(Effect.flip);
      assert.deepStrictEqual(
        folder,
        new ImageUploads.InvalidImageRequest({ reason: 'folder' }),
      );
    }),
  );

  it.effect('keeps a sponsor’s saved logo to its admins and members', () =>
    Effect.gen(function* () {
      const logo =
        'https://res.cloudinary.com/earn/image/upload/v1/sponsor-dev/logo.png';
      const sponsorUser = (role: string) =>
        user({
          currentSponsorId: 's1',
          currentSponsor: { logo },
          UserSponsors: [{ sponsorId: 's1', role }],
        });
      const refused = yield* remove(
        { user: sponsorUser('VIEWER') },
        { publicId: 'sponsor-dev/logo', source: 'sponsor' },
      ).pipe(Effect.flip);
      assert.deepStrictEqual(
        refused,
        new ImageUploads.ImageForbidden({ reason: 'sponsorRole' }),
      );
      const done = yield* remove(
        { user: sponsorUser('ADMIN') },
        { publicId: 'sponsor-dev/logo', source: 'sponsor' },
      );
      assert.deepStrictEqual(done, ['sponsor-dev/logo']);
    }),
  );

  it.effect('never deletes an image a live listing still shows', () =>
    Effect.gen(function* () {
      const error = yield* remove(
        {
          user: user({ currentSponsorId: 's1' }),
          bounty: { id: 'b1', title: 'Bounty' },
        },
        { publicId: 'description-dev/pic', source: 'description' },
      ).pipe(Effect.flip);
      assert.deepStrictEqual(
        error,
        new ImageUploads.ImageInUse({ bountyId: 'b1', bountyTitle: 'Bounty' }),
      );
      const noSponsor = yield* remove(
        {},
        { publicId: 'description-dev/pic', source: 'description' },
      ).pipe(Effect.flip);
      assert.deepStrictEqual(
        noSponsor,
        new ImageUploads.ImageForbidden({ reason: 'descriptionDelete' }),
      );
    }),
  );

  it.effect('lets a grantee delete proofs saved on their tranches', () =>
    Effect.gen(function* () {
      const deleted = yield* remove(
        {
          tranches: [
            {
              eventPictures: [
                'https://res.cloudinary.com/earn/image/upload/v1/grant-event-pictures-dev/p.jpg',
              ],
            },
          ],
        },
        {
          publicId: 'grant-event-pictures-dev/p',
          source: 'grant-event-pictures',
        },
      );
      assert.deepStrictEqual(deleted, ['grant-event-pictures-dev/p']);
      const refused = yield* remove(
        {},
        {
          publicId: 'grant-event-pictures-dev/q',
          source: 'grant-event-pictures',
        },
      ).pipe(Effect.flip);
      assert.strictEqual(refused._tag, 'ImageForbidden');
    }),
  );
});

describe('ImageUploads.sign', () => {
  it.effect('signs up to 20 a minute each, then refuses', () =>
    Effect.gen(function* () {
      yield* TestClock.setTime(0);
      const uploads = yield* ImageUploads.ImageUploads;
      for (let i = 0; i < 20; i++) {
        const { rate } = yield* uploads.sign('u1', { source: 'user' });
        assert.strictEqual(rate.remaining, 19 - i);
      }
      const limited = yield* uploads
        .sign('u1', { source: 'user' })
        .pipe(Effect.flip);
      assert.strictEqual(limited._tag, 'UploadRateLimited');
      // Someone else's count is their own.
      yield* uploads.sign('u2', { source: 'user' });
      yield* TestClock.adjust('61 seconds');
      yield* uploads.sign('u1', { source: 'user' });
    }).pipe(Effect.provide(setup().layer)),
  );

  it.effect('refuses bad bodies, big files and listing images', () =>
    Effect.gen(function* () {
      const uploads = yield* ImageUploads.ImageUploads;
      for (const body of [
        null,
        { source: 'avatar' },
        { source: 'user', contentLength: 6 * 1024 * 1024 },
      ]) {
        const error = yield* uploads.sign('u1', body).pipe(Effect.flip);
        assert.strictEqual(error._tag, 'InvalidImageRequest');
      }
      // Grant proofs may be larger.
      yield* uploads.sign('u1', {
        source: 'grant-event-pictures',
        contentLength: 10 * 1024 * 1024,
      });
      const description = yield* uploads
        .sign('u1', { source: 'description' })
        .pipe(Effect.flip);
      assert.deepStrictEqual(
        description,
        new ImageUploads.ImageForbidden({ reason: 'descriptionUpload' }),
      );
    }).pipe(Effect.provide(setup().layer)),
  );
});
