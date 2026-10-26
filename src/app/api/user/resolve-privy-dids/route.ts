import * as Effect from 'effect/Effect';
import { NextResponse, type NextRequest } from 'next/server';

import { json, readerUser } from '@/lib/route-guard';
import { runtime } from '@/server/runtime';
import * as TalentDirectory from '@/server/talent-directory';

import { PRIVY_DIDS } from './privy-dids';

// Earn user ids for the Privy accounts listed in ./privy-dids, for
// one-off maintenance.
export function GET(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const reader = yield* readerUser(request);
      if (reader instanceof NextResponse) return reader;
      if (PRIVY_DIDS.length === 0) {
        return json(400, {
          error: 'No privyDids configured',
          message:
            'Add at least one privyDid to PRIVY_DIDS in this endpoint file.',
        });
      }
      return yield* TalentDirectory.TalentDirectory.use((directory) =>
        directory.userIdsFor(PRIVY_DIDS),
      ).pipe(
        Effect.map((userIds) => json(200, { userIds })),
        Effect.catchTag('DatabaseError', () =>
          Effect.succeed(
            json(500, {
              error: 'Internal Server Error',
              message:
                'Error occurred while resolving user IDs from privyDids.',
            }),
          ),
        ),
      );
    }),
  );
}
