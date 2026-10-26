import { assert, describe, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { TestClock } from 'effect/testing';

import * as CreditHistory from '@/server/credit-history';
import * as Database from '@/server/database';

const NOW = Date.parse('2026-10-26T12:00:00Z');

interface Row {
  readonly id: string;
  readonly createdAt: Date;
  readonly effectiveMonth: Date;
  readonly type: string;
  readonly change: number;
  readonly decision: string | null;
  readonly submission: unknown;
  readonly application: unknown;
}

const row = (
  id: string,
  type: string,
  change: number,
  effectiveMonth: string,
  createdAt: string,
  extra: Partial<Row> = {},
): Row => ({
  id,
  type,
  change,
  effectiveMonth: new Date(effectiveMonth),
  createdAt: new Date(createdAt),
  decision: null,
  submission: null,
  application: null,
  ...extra,
});

// The ledger, filtered by the months asked for, as Prisma would.
const layerWith = (createdAt: string, rows: ReadonlyArray<Row>) => {
  const asked: Array<ReadonlyArray<string>> = [];
  const layer = CreditHistory.layer.pipe(
    Layer.provide(
      Layer.succeed(
        Database.Database,
        Database.Database.of({
          query: (_operation, run) =>
            Effect.promise(() =>
              run({
                user: {
                  findUnique: async () => ({ createdAt: new Date(createdAt) }),
                },
                creditLedger: {
                  findMany: async ({
                    where,
                  }: {
                    where: { effectiveMonth: { in: ReadonlyArray<Date> } };
                  }) => {
                    const months = where.effectiveMonth.in.map((month) =>
                      month.toISOString(),
                    );
                    asked.push(months);
                    return rows.filter((entry) =>
                      months.includes(entry.effectiveMonth.toISOString()),
                    );
                  },
                },
              } as never),
            ),
        }),
      ),
    ),
  );
  return { layer, asked };
};

const historyOf = (createdAt: string, rows: ReadonlyArray<Row> = []) => {
  const { layer, asked } = layerWith(createdAt, rows);
  return Effect.gen(function* () {
    yield* TestClock.setTime(NOW);
    const entries = yield* CreditHistory.CreditHistory.use((history) =>
      history.history('user'),
    );
    return { entries, asked };
  }).pipe(Effect.provide(layer));
};

describe('CreditHistory.history', () => {
  it.effect('covers next month back three, for an older account', () =>
    Effect.gen(function* () {
      const { asked, entries } = yield* historyOf('2024-01-10T00:00:00Z');
      assert.deepStrictEqual(asked[0], [
        '2026-11-01T00:00:00.000Z',
        '2026-10-01T00:00:00.000Z',
        '2026-09-01T00:00:00.000Z',
        '2026-08-01T00:00:00.000Z',
        '2026-07-01T00:00:00.000Z',
      ]);
      // A renewal for each month, and every past month's 3 credits expired
      // unspent; newest first.
      assert.deepStrictEqual(
        entries.map((entry) => [entry.id, entry.change]),
        [
          ['2026-11-01T00:00:00.000Z-credit', 3],
          ['2026-10-01T00:00:00.000Z-credit', 3],
          ['2026-09-01T00:00:00.000Z-expiry', -3],
          ['2026-09-01T00:00:00.000Z-credit', 3],
          ['2026-08-01T00:00:00.000Z-expiry', -3],
          ['2026-08-01T00:00:00.000Z-credit', 3],
          ['2026-07-01T00:00:00.000Z-expiry', -3],
          ['2026-07-01T00:00:00.000Z-credit', 3],
        ],
      );
      const upcoming = entries[0]?.submission as {
        listing: { title: string };
      };
      assert.strictEqual(upcoming.listing.title, '3 Credits will be issued');
    }),
  );

  it.effect('starts at the account’s first month, dated when it joined', () =>
    Effect.gen(function* () {
      const { asked, entries } = yield* historyOf('2026-09-15T08:00:00Z');
      assert.deepStrictEqual(asked[0], [
        '2026-11-01T00:00:00.000Z',
        '2026-10-01T00:00:00.000Z',
        '2026-09-01T00:00:00.000Z',
      ]);
      const first = entries.find(
        (entry) => entry.id === '2026-09-01T00:00:00.000Z-credit',
      );
      assert.strictEqual(
        first?.createdAt.toISOString(),
        '2026-09-15T08:00:00.000Z',
      );
    }),
  );

  it.effect('expires only what was left, and shows grants as listings', () =>
    Effect.gen(function* () {
      const { entries } = yield* historyOf('2026-09-01T00:00:00Z', [
        row(
          'spent',
          'SUBMISSION',
          -3,
          '2026-09-01T00:00:00Z',
          '2026-09-03T00:00:00Z',
        ),
        row(
          'grant',
          'GRANT_WIN_BONUS',
          1,
          '2026-11-01T00:00:00Z',
          '2026-10-20T00:00:00Z',
          {
            application: {
              id: 'application',
              grant: {
                title: 'A grant',
                slug: 'a-grant',
                sponsor: { name: 'Sponsor', logo: 'logo' },
              },
            },
          },
        ),
      ]);
      assert.isUndefined(
        entries.find((entry) => entry.id === '2026-09-01T00:00:00.000Z-expiry'),
      );
      const grant = entries.find((entry) => entry.id === 'grant');
      assert.deepStrictEqual(grant?.submission, {
        id: 'application',
        listing: {
          title: 'A grant',
          slug: 'a-grant',
          type: 'bounty',
          sponsor: { name: 'Sponsor', logo: 'logo' },
        },
        user: { photo: '', id: '', firstName: '' },
      });
      assert.isNull(grant?.application);
    }),
  );

  it.effect('never reaches before the ledger began in April 2025', () =>
    Effect.gen(function* () {
      const { layer, asked } = layerWith('2024-01-01T00:00:00Z', []);
      yield* Effect.gen(function* () {
        yield* TestClock.setTime(Date.parse('2025-05-10T00:00:00Z'));
        yield* CreditHistory.CreditHistory.use((history) =>
          history.history('user'),
        );
      }).pipe(Effect.provide(layer));
      assert.deepStrictEqual(asked[0], [
        '2025-06-01T00:00:00.000Z',
        '2025-05-01T00:00:00.000Z',
        '2025-04-01T00:00:00.000Z',
      ]);
    }),
  );
});
