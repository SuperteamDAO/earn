import { assert, describe, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import * as Database from '@/server/database';
import * as Earncognito from '@/server/earncognito';
import * as ListingReports from '@/server/listing-reports';
import * as RateLimits from '@/server/rate-limits';

const REPORT = {
  listingTitle: 'Write a thread',
  listingUrl: 'https://superteam.fun/earn/listing/thread/',
  reasonTitle: 'Unclear Scope',
  reasonSubtext: '',
  userEmail: 'someone-else@example.com',
};

interface Options {
  email?: string | null;
  limited?: boolean;
  upstream?: number;
}

const setup = (options: Options = {}) => {
  const posts: Array<{ path: string; body: unknown }> = [];
  const checks: Array<string> = [];
  const client = {
    user: {
      findUnique: async () => ({
        email: 'email' in options ? options.email : 'ada@example.com',
      }),
    },
  };
  const deps = Layer.mergeAll(
    Layer.succeed(
      Database.Database,
      Database.Database.of({
        query: (_operation, run) =>
          // oxlint-disable-next-line typescript/no-unsafe-type-assertion
          Effect.promise(() => run(client as never)),
      }),
    ),
    Layer.succeed(
      RateLimits.RateLimits,
      RateLimits.RateLimits.of({
        check: (limit, identifier) => {
          checks.push(`${limit}:${identifier}`);
          return options.limited
            ? Effect.fail(
                new RateLimits.RateLimited({ limit, retryAfterSeconds: 60 }),
              )
            : Effect.void;
        },
      }),
    ),
    Layer.succeed(
      Earncognito.Earncognito,
      Earncognito.Earncognito.of({
        post: (path, body) => {
          posts.push({ path, body });
          return options.upstream
            ? Effect.fail(
                new Earncognito.EarncognitoError({
                  path,
                  status: options.upstream,
                }),
              )
            : Effect.succeed(null);
        },
      }),
    ),
  );
  return {
    layer: ListingReports.layer.pipe(Layer.provide(deps)),
    posts,
    checks,
  };
};

const report = (
  layer: Layer.Layer<ListingReports.ListingReports>,
  payload: unknown,
) =>
  ListingReports.ListingReports.use((reports) =>
    reports.report('u1', payload),
  ).pipe(Effect.provide(layer));

describe('ListingReports.report', () => {
  it.effect('sends it to earncognito with the account’s email', () =>
    Effect.gen(function* () {
      const { layer, posts, checks } = setup();
      yield* report(layer, REPORT);
      assert.deepStrictEqual(checks, ['reportListing:u1']);
      assert.deepStrictEqual(posts, [
        {
          path: '/telegram/report-listing',
          body: { ...REPORT, userEmail: 'ada@example.com' },
        },
      ]);
    }),
  );

  it.effect('is rate limited per account', () =>
    Effect.gen(function* () {
      const { layer, posts } = setup({ limited: true });
      const error = yield* Effect.flip(report(layer, REPORT));
      assert.strictEqual(error._tag, 'RateLimited');
      assert.lengthOf(posts, 0);
    }),
  );

  it.effect('needs an email on the account', () =>
    Effect.gen(function* () {
      const { layer, posts } = setup({ email: null });
      const error = yield* Effect.flip(report(layer, REPORT));
      assert.strictEqual(error._tag, 'ReporterWithoutEmail');
      assert.lengthOf(posts, 0);
    }),
  );

  it.effect('refuses a malformed report', () =>
    Effect.gen(function* () {
      const { layer, posts } = setup();
      for (const payload of [
        { ...REPORT, listingTitle: '' },
        { ...REPORT, listingUrl: 'not a url' },
        { ...REPORT, reasonTitle: undefined },
        null,
      ]) {
        const error = yield* Effect.flip(report(layer, payload));
        assert.strictEqual(error._tag, 'InvalidReport');
      }
      assert.lengthOf(posts, 0);
    }),
  );

  it.effect('passes earncognito’s refusal on', () =>
    Effect.gen(function* () {
      const { layer } = setup({ upstream: 502 });
      const error = yield* Effect.flip(report(layer, REPORT));
      assert.strictEqual(error._tag, 'EarncognitoError');
    }),
  );
});
