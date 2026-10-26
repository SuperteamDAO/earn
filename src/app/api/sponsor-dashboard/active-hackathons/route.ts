import * as Effect from 'effect/Effect';
import { NextResponse, type NextRequest } from 'next/server';

import { json, readerSponsor } from '@/lib/route-guard';
import { runtime } from '@/server/runtime';
import * as SponsorDashboard from '@/server/sponsor-dashboard';

// Hackathons a sponsor can add a track to (the listing builder asks).
export function GET(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const sponsor = yield* readerSponsor(request);
      if (sponsor instanceof NextResponse) return sponsor;
      return yield* SponsorDashboard.SponsorDashboard.use(
        (dashboard) => dashboard.activeHackathons,
      ).pipe(
        Effect.map((hackathons) => json(200, hackathons)),
        Effect.catchTag('DatabaseError', () =>
          Effect.succeed(
            json(500, {
              message: 'Error looking for active hackathon',
              error: 'Internal Server Error',
            }),
          ),
        ),
      );
    }),
  );
}
