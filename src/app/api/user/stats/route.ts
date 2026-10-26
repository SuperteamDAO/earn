import * as Effect from 'effect/Effect';
import type { NextRequest } from 'next/server';

import { json, readerUser } from '@/lib/route-guard';
import * as HomeStats from '@/server/home-stats';
import { runtime } from '@/server/runtime';

// The signed-in talent's participations, wins and winnings.
export function GET(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const writer = yield* readerUser(request);
      if (writer instanceof Response) return writer;
      const stats = yield* HomeStats.HomeStats.use((home) =>
        home.userStats(writer.userId),
      );
      return json(200, stats);
    }).pipe(
      Effect.catchTags({
        UserNotFound: () =>
          Effect.succeed(json(404, { error: 'User not found' })),
        DatabaseError: () =>
          Effect.succeed(
            json(500, {
              error: 'Error occurred while processing the request.',
            }),
          ),
      }),
    ),
  );
}
