import 'server-only';

import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { MONTHLY_CREDITS, monthStart } from '@/server/credits';
import * as Database from '@/server/database';

// Earn's credit ledger began in April 2025; no history before it.
const LEDGER_START = Date.UTC(2025, 3, 1);

const ENTRY = {
  id: true,
  createdAt: true,
  effectiveMonth: true,
  type: true,
  change: true,
  decision: true,
  submission: {
    select: {
      id: true,
      listing: {
        select: {
          title: true,
          type: true,
          slug: true,
          sponsor: { select: { name: true, logo: true } },
        },
      },
      user: { select: { photo: true, id: true, firstName: true } },
    },
  },
  application: {
    select: {
      id: true,
      grant: {
        select: {
          title: true,
          slug: true,
          sponsor: { select: { name: true, logo: true } },
        },
      },
    },
  },
} as const;

// One row of the credit drawer, as Earn's /api/user/credit/history sent it:
// ledger entries (grant applications shaped like submissions), plus each
// month's renewal and, for past months, what expired unspent.
export interface CreditHistoryEntry {
  readonly id: string;
  readonly createdAt: Date;
  readonly effectiveMonth: Date;
  readonly type: string;
  readonly change: number;
  readonly decision?: string | null;
  readonly submission: unknown;
  readonly application?: unknown;
}

export class CreditHistory extends Context.Service<
  CreditHistory,
  {
    // From next month back three, never before the account or the ledger.
    readonly history: (
      userId: string,
    ) => Effect.Effect<
      ReadonlyArray<CreditHistoryEntry>,
      Database.DatabaseError
    >;
  }
>()('earn/CreditHistory') {}

const make = Effect.gen(function* () {
  const database = yield* Database.Database;

  const history = Effect.fn('CreditHistory.history')(function* (
    userId: string,
  ) {
    const now = yield* Clock.currentTimeMillis;
    const user = yield* database.query('creditHistoryUser', (client) =>
      client.user.findUnique({
        where: { id: userId },
        select: { createdAt: true },
      }),
    );
    if (!user) return [];
    const createdMonth = monthStart(user.createdAt.getTime()).getTime();
    const currentMonth = monthStart(now).getTime();

    const months: Array<Date> = [];
    for (let offset = 1; offset >= -3; offset--) {
      const month = monthStart(now, offset);
      if (month.getTime() >= LEDGER_START && month.getTime() >= createdMonth) {
        months.push(month);
      }
    }

    const rows = yield* database.query('creditHistory', (client) =>
      client.creditLedger.findMany({
        where: { userId, effectiveMonth: { in: months } },
        orderBy: [{ effectiveMonth: 'desc' }, { createdAt: 'desc' }],
        select: ENTRY,
      }),
    );

    const entries: Array<CreditHistoryEntry> = rows.map((entry) =>
      entry.application
        ? {
            ...entry,
            submission: {
              id: entry.application.id,
              listing: {
                title: entry.application.grant.title,
                slug: entry.application.grant.slug,
                type: 'bounty',
                sponsor: entry.application.grant.sponsor,
              },
              user: { photo: '', id: '', firstName: '' },
            },
            application: null,
          }
        : entry,
    );

    const synthetic: Array<CreditHistoryEntry> = [];
    for (const month of months) {
      const start = month.getTime();
      const key = month.toISOString();
      const ledgerSum = entries
        .filter(
          (entry) =>
            monthStart(entry.effectiveMonth.getTime()).getTime() === start,
        )
        .reduce((sum, entry) => sum + entry.change, 0);

      if (start < currentMonth) {
        const left = MONTHLY_CREDITS + ledgerSum;
        if (left > 0) {
          synthetic.push({
            id: `${key}-expiry`,
            // The month's last moment.
            createdAt: new Date(monthStart(start, 1).getTime() - 1),
            type: 'CREDIT_EXPIRY',
            effectiveMonth: new Date(key),
            change: -left,
            submission: {
              listing: { title: 'Remaining credits expired', type: '' },
            },
          });
        }
      }

      // Their first month's credits date from when they joined.
      const upcoming = start > currentMonth;
      synthetic.push({
        id: `${key}-credit`,
        createdAt: start === createdMonth ? user.createdAt : new Date(key),
        type: 'MONTHLY_CREDIT',
        effectiveMonth: new Date(key),
        change: MONTHLY_CREDITS,
        submission: {
          listing: {
            title: upcoming
              ? `${MONTHLY_CREDITS} Credits will be issued`
              : `Added ${MONTHLY_CREDITS} credits to your balance`,
            type: '',
          },
        },
      });
    }

    return [...entries, ...synthetic].toSorted(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  });

  return CreditHistory.of({ history });
});

export const layer = Layer.effect(CreditHistory, make);
