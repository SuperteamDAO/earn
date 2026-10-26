import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import { NextResponse, type NextRequest } from 'next/server';

import { json, readerUser } from '@/lib/route-guard';
import { runtime } from '@/server/runtime';
import * as SponsorAccounts from '@/server/sponsor-accounts';

// The sponsor the signed-in account acts for (null without one).
export function GET(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const writer = yield* readerUser(request);
      if (writer instanceof NextResponse) return writer;
      return yield* SponsorAccounts.SponsorAccounts.use((accounts) =>
        accounts.current(writer.userId),
      ).pipe(
        Effect.map((sponsor) => json(200, Option.getOrNull(sponsor))),
        Effect.catchTags({
          UserNotFound: () =>
            Effect.succeed(json(404, { error: 'User not found' })),
          DatabaseError: () =>
            Effect.succeed(
              json(500, {
                error: 'Internal Server Error',
                message: 'Error occurred while fetching user.',
              }),
            ),
        }),
      );
    }),
  );
}
