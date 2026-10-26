import * as Effect from 'effect/Effect';
import { NextResponse, type NextRequest } from 'next/server';

import { json, readerSponsor } from '@/lib/route-guard';
import { runtime } from '@/server/runtime';
import * as SponsorAccounts from '@/server/sponsor-accounts';

// Earn's parseBoundedIntegerParam for `take`: 1 to 100, 50 when absent.
function parseTake(raw: string | null): number | string {
  if (raw === null) return 50;
  if (!/^\d+$/.test(raw)) return 'take must be a non-negative integer';
  const value = Number(raw);
  if (!Number.isSafeInteger(value)) return 'take is too large';
  if (value < 1) return 'take must be at least 1';
  return Math.min(value, 100);
}

// The sponsors the signed-in sponsor may switch to, for the switcher.
export function GET(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const writer = yield* readerSponsor(request);
      if (writer instanceof NextResponse) return writer;
      const params = request.nextUrl.searchParams;
      const take = parseTake(params.get('take'));
      if (typeof take === 'string') return json(400, { error: take });
      return yield* SponsorAccounts.SponsorAccounts.use((accounts) =>
        accounts.list(writer, params.get('searchString') ?? '', take),
      ).pipe(
        Effect.map((sponsors) => json(200, sponsors)),
        Effect.catchTag('DatabaseError', () =>
          Effect.succeed(
            json(500, {
              error: 'Internal Server Error',
              message: 'Error occurred while fetching sponsors',
            }),
          ),
        ),
      );
    }),
  );
}
