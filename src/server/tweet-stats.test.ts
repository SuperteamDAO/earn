import { assert, describe, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Redacted from 'effect/Redacted';
import { afterEach, vi } from 'vitest';

import * as AppConfig from '@/server/app-config';
import * as Database from '@/server/database';
import { testConfig } from '@/server/test-config';
import * as TweetStats from '@/server/tweet-stats';

afterEach(() => {
  vi.unstubAllGlobals();
});

// What the last submission lookup asked for.
let lastWhere: unknown = null;

const layerFor = (
  submission: { link: string | null; tweet: string | null } | null,
  token = true,
) =>
  TweetStats.layer.pipe(
    Layer.provide(
      Layer.mergeAll(
        Layer.succeed(AppConfig.AppConfig, {
          ...testConfig,
          xBearerToken: token ? Redacted.make('bearer') : undefined,
        }),
        Layer.succeed(
          Database.Database,
          Database.Database.of({
            query: (_operation, run) =>
              Effect.promise(() =>
                run({
                  submission: {
                    findFirst: async (args: { where: unknown }) => {
                      lastWhere = args.where;
                      return submission;
                    },
                  },
                } as never),
              ),
          }),
        ),
      ),
    ),
  );

const SPONSOR = { sponsorId: 'sp1', god: false };

const statsFor = (...args: Parameters<typeof layerFor>) =>
  TweetStats.TweetStatsReader.use((stats) =>
    stats.forSubmission('s1', SPONSOR),
  ).pipe(Effect.provide(layerFor(...args)));

describe('extractTweetId', () => {
  it('reads the status id from X and Twitter links only', () => {
    assert.strictEqual(
      TweetStats.extractTweetId('https://x.com/ada/status/123?s=20'),
      '123',
    );
    assert.strictEqual(
      TweetStats.extractTweetId('twitter.com/ada/status/456'),
      '456',
    );
    assert.isNull(TweetStats.extractTweetId('https://x.com/ada'));
    assert.isNull(TweetStats.extractTweetId('https://example.com/status/1'));
    assert.isNull(TweetStats.extractTweetId('https://x.com/a/status/abc'));
  });
});

describe('TweetStats.forSubmission', () => {
  it.effect('looks only at submissions to the sponsor’s own listings', () =>
    Effect.gen(function* () {
      yield* TweetStats.TweetStatsReader.use((stats) =>
        stats.forSubmission('s1', SPONSOR),
      ).pipe(
        Effect.provide(layerFor({ link: null, tweet: null }, false)),
        Effect.ignore,
      );
      assert.deepStrictEqual(lastWhere, {
        id: 's1',
        listing: { sponsorId: 'sp1' },
      });
      yield* TweetStats.TweetStatsReader.use((stats) =>
        stats.forSubmission('s1', { sponsorId: 'sp1', god: true }),
      ).pipe(
        Effect.provide(layerFor({ link: null, tweet: null }, false)),
        Effect.ignore,
      );
      assert.deepStrictEqual(lastWhere, { id: 's1' });
    }),
  );

  it.effect('maps X’s metrics, counting quotes as reposts', () =>
    Effect.gen(function* () {
      vi.stubGlobal(
        'fetch',
        async () =>
          new Response(
            JSON.stringify({
              data: [
                {
                  id: '1',
                  public_metrics: {
                    impression_count: 100,
                    like_count: 5,
                    retweet_count: 2,
                    quote_count: 1,
                    reply_count: 3,
                  },
                },
              ],
            }),
          ),
      );
      const stats = yield* statsFor({
        link: 'https://x.com/a/status/1',
        tweet: 'https://x.com/a/status/2',
      });
      assert.deepStrictEqual(stats.data.link, {
        views: 100,
        likes: 5,
        retweets: 3,
        comments: 3,
        isAvailable: true,
      });
      // X said nothing about this one.
      assert.strictEqual(stats.data.tweet?.isAvailable, false);
    }),
  );

  it.effect('answers zeros without posts, a token or X', () =>
    Effect.gen(function* () {
      const none = yield* statsFor({ link: 'https://github.com', tweet: null });
      assert.deepStrictEqual(none.data, { link: null, tweet: null });
      const noToken = yield* statsFor(
        { link: 'https://x.com/a/status/1', tweet: null },
        false,
      );
      assert.strictEqual(noToken.data.link?.isAvailable, false);
      vi.stubGlobal('fetch', async () => new Response('', { status: 500 }));
      const down = yield* statsFor({
        link: 'https://x.com/a/status/1',
        tweet: null,
      });
      assert.strictEqual(down.message, 'Operation successful');
      assert.strictEqual(down.data.link?.views, 0);
    }),
  );

  it.effect('refuses an unknown submission', () =>
    Effect.gen(function* () {
      const error = yield* statsFor(null).pipe(Effect.flip);
      assert.strictEqual(error._tag, 'SubmissionNotFound');
    }),
  );
});
