import * as Effect from 'effect/Effect';
import type { NextRequest } from 'next/server';

import { json, readerSponsor } from '@/lib/route-guard';
import * as HomeStats from '@/server/home-stats';
import { runtime } from '@/server/runtime';

// The current sponsor's record on Earn, for its dashboard.
export function GET(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const sponsor = yield* readerSponsor(request);
      if (sponsor instanceof Response) return sponsor;
      const stats = yield* HomeStats.HomeStats.use((home) =>
        home.sponsorStats(sponsor.sponsorId),
      );
      return json(200, stats);
    }).pipe(
      Effect.catchTags({
        SponsorNotFound: () =>
          Effect.succeed(json(404, { error: 'Sponsor not found' })),
        DatabaseError: () =>
          Effect.succeed(json(500, { error: 'Internal Server Error' })),
      }),
    ),
  );
}
