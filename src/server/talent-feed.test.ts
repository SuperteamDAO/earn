import { assert, describe, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { TestClock } from 'effect/testing';

import * as AppConfig from '@/server/app-config';
import * as Database from '@/server/database';
import * as ImageStore from '@/server/image-store';
import * as TalentFeed from '@/server/talent-feed';
import { testConfig } from '@/server/test-config';

const NOW = Date.parse('2026-10-20T12:00:00Z');

const author = {
  id: 'u1',
  firstName: 'Ada',
  lastName: 'L',
  photo: null,
  username: 'ada',
};

const submission = (overrides: {
  id: string;
  createdAt: string;
  likeCount?: number;
  isPrivate?: boolean;
  isWinnersAnnounced?: boolean;
  isWinner?: boolean;
}) => ({
  id: overrides.id,
  userId: 'u1',
  createdAt: new Date(overrides.createdAt),
  link: `https://example.com/${overrides.id}`,
  tweet: '',
  otherInfo: 'notes',
  isWinner: overrides.isWinner ?? false,
  winnerPosition: overrides.isWinner ? 1 : null,
  like: [],
  likeCount: overrides.likeCount ?? 0,
  ogImage: null,
  user: author,
  listing: {
    id: 'l1',
    title: 'Listing',
    rewards: { 1: 100 },
    type: 'bounty',
    slug: 'listing',
    isWinnersAnnounced: overrides.isWinnersAnnounced ?? true,
    token: 'USDC',
    sponsor: { name: 'Acme', logo: null, slug: 'acme' },
    winnersAnnouncedAt: new Date('2026-10-01T00:00:00Z'),
    isPrivate: overrides.isPrivate ?? false,
  },
  Comments: [],
  _count: { Comments: 0 },
});

const pow = (id: string, createdAt: string, likeCount = 0) => ({
  id,
  createdAt: new Date(createdAt),
  description: 'A project',
  title: 'Project',
  link: 'https://example.com',
  like: [],
  likeCount,
  ogImage: null,
  user: author,
  Comments: [],
  _count: { Comments: 0 },
});

interface Data {
  viewer?: { id: string } | null;
  submissions?: ReadonlyArray<unknown>;
  pows?: ReadonlyArray<unknown>;
  highlighted?: unknown;
}

// A stand-in for Prisma: only the calls the service makes, recording the
// `where`s it was asked.
const fakeDatabase = (data: Data) => {
  const asked: Array<{ table: string; args: unknown }> = [];
  const client = {
    user: { findUnique: async () => data.viewer ?? null },
    submission: {
      findMany: async (args: unknown) => {
        asked.push({ table: 'submission', args });
        return [...(data.submissions ?? [])];
      },
      findFirst: async () => data.highlighted ?? null,
    },
    poW: {
      findMany: async (args: unknown) => {
        asked.push({ table: 'pow', args });
        return [...(data.pows ?? [])];
      },
      findUnique: async () => null,
    },
    grantApplication: {
      findMany: async () => [],
      findUnique: async () => null,
    },
  };
  const layer = TalentFeed.layer.pipe(
    Layer.provide(
      Layer.mergeAll(
        Layer.succeed(
          Database.Database,
          Database.Database.of({
            query: (_operation, run) =>
              Effect.promise(() => run(client as never)),
          }),
        ),
        ImageStore.layer.pipe(
          Layer.provide(Layer.succeed(AppConfig.AppConfig, testConfig)),
        ),
      ),
    ),
  );
  return { layer, asked };
};

const list = (
  data: Data,
  query: Partial<TalentFeed.FeedQuery>,
  privyDid: string | null = null,
) => {
  const database = fakeDatabase(data);
  return Effect.gen(function* () {
    yield* TestClock.setTime(NOW);
    const items = yield* TalentFeed.TalentFeed.use((feed) =>
      feed.list({ take: 15, skip: 0, ...query }, privyDid),
    );
    return { items, asked: database.asked };
  }).pipe(Effect.provide(database.layer));
};

describe('TalentFeed.list', () => {
  it.effect('hides unannounced and private work from others', () =>
    Effect.gen(function* () {
      const { items } = yield* list(
        {
          submissions: [
            submission({
              id: 'hidden',
              createdAt: '2026-10-10T00:00:00Z',
              isWinnersAnnounced: false,
            }),
            submission({
              id: 'secret',
              createdAt: '2026-10-09T00:00:00Z',
              isPrivate: true,
            }),
          ],
        },
        { userId: 'u1' },
        'did:privy:someone-else',
      );
      const [unannounced, secret] = items;
      assert.isNull(unannounced?.id);
      assert.isNull(unannounced?.link);
      assert.isNull(unannounced?.isWinner);
      assert.isNull(secret?.id);
      assert.isNull(secret?.listingTitle);
      assert.isNull(secret?.sponsorName);
      assert.isTrue(secret?.isPrivate);
    }),
  );

  it.effect('shows talent everything on their own profile', () =>
    Effect.gen(function* () {
      const { items } = yield* list(
        {
          viewer: { id: 'u1' },
          submissions: [
            submission({
              id: 'secret',
              createdAt: '2026-10-09T00:00:00Z',
              isPrivate: true,
              isWinnersAnnounced: false,
            }),
          ],
        },
        { userId: 'u1' },
        'did:privy:ada',
      );
      assert.strictEqual(items[0]?.id, 'secret');
      assert.strictEqual(items[0]?.link, 'https://example.com/secret');
      assert.strictEqual(items[0]?.listingTitle, 'Listing');
      assert.isFalse(items[0]?.isPrivate);
    }),
  );

  it.effect('keeps private listings off the public feed', () =>
    Effect.gen(function* () {
      const { asked } = yield* list({}, { filter: 'new' });
      const call = asked.find((entry) => entry.table === 'submission');
      const args = call?.args as { where: { listing: unknown } } | undefined;
      assert.deepStrictEqual(args?.where.listing, { isPrivate: false });
    }),
  );

  it.effect('sorts popular by likes, then newest; dates as ISO', () =>
    Effect.gen(function* () {
      const { items } = yield* list(
        {
          submissions: [
            submission({ id: 's1', createdAt: '2026-10-10T00:00:00Z' }),
          ],
          pows: [
            pow('p-old', '2026-10-05T00:00:00Z', 3),
            pow('p-new', '2026-10-11T00:00:00Z', 3),
            pow('p-liked', '2026-10-01T00:00:00Z', 9),
          ],
        },
        { filter: 'popular', timePeriod: 'this month' },
      );
      assert.deepStrictEqual(
        items.map((item) => item.id),
        ['p-liked', 'p-new', 'p-old', 's1'],
      );
      assert.strictEqual(items[1]?.createdAt, '2026-10-11T00:00:00.000Z');
    }),
  );

  it.effect('puts a highlighted post first, fetched if not in the page', () =>
    Effect.gen(function* () {
      const { items } = yield* list(
        {
          submissions: [
            submission({ id: 'newest', createdAt: '2026-10-12T00:00:00Z' }),
          ],
          highlighted: submission({
            id: 'b6b2f8a0-0000-4000-8000-000000000000',
            createdAt: '2026-01-01T00:00:00Z',
          }),
        },
        {
          filter: 'new',
          highlightId: 'b6b2f8a0-0000-4000-8000-000000000000',
          highlightType: 'submission',
        },
      );
      assert.strictEqual(items[0]?.id, 'b6b2f8a0-0000-4000-8000-000000000000');
      assert.strictEqual(items[1]?.id, 'newest');
    }),
  );

  it.effect('skips projects on the winners feed', () =>
    Effect.gen(function* () {
      const { asked } = yield* list(
        { pows: [pow('p', '2026-10-05T00:00:00Z')] },
        { isWinner: true },
      );
      assert.isFalse(asked.some((call) => call.table === 'pow'));
    }),
  );
});
