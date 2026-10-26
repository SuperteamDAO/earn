import { assert, describe, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import * as Database from '@/server/database';
import * as SponsorLanding from '@/server/sponsor-landing';

describe('SponsorLanding.stats', () => {
  it.effect('counts as Earn’s homepage does, once an hour', () =>
    Effect.gen(function* () {
      let queries = 0;
      const client = {
        user: { count: async () => (queries++, 150_294) },
        bounties: {
          aggregate: async () => ({ _sum: { usdValue: 1_000_001 } }),
        },
        grantApplication: {
          aggregate: async () => ({ _sum: { approvedAmountInUSD: null } }),
        },
      };
      const layer = SponsorLanding.layer.pipe(
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
      yield* Effect.gen(function* () {
        const landing = yield* SponsorLanding.SponsorLanding;
        const stats = yield* landing.stats;
        assert.deepStrictEqual(stats, {
          totalUsers: 150_010,
          totalInUSD: 1_000_010,
        });
        yield* landing.stats;
        assert.strictEqual(queries, 1);
      }).pipe(Effect.provide(layer));
    }),
  );
});
