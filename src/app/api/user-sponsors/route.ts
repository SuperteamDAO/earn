import * as Effect from 'effect/Effect';
import { NextResponse, type NextRequest } from 'next/server';

import { json, readerUser } from '@/lib/route-guard';
import { runtime } from '@/server/runtime';
import * as TeamMembers from '@/server/team-members';

export interface UserSponsorsResponse {
  hasSponsorMembership: boolean;
}

// Whether the signed-in account is on any sponsor's team (onboarding asks).
export function GET(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const writer = yield* readerUser(request);
      if (writer instanceof NextResponse) return writer;
      return yield* TeamMembers.TeamMembers.use((team) =>
        team.hasMembership(writer.userId),
      ).pipe(
        Effect.map((hasSponsorMembership) =>
          json(200, {
            hasSponsorMembership,
          } satisfies UserSponsorsResponse),
        ),
        Effect.catchTag('DatabaseError', () =>
          Effect.succeed(
            json(500, { error: 'Unable to check sponsor membership.' }),
          ),
        ),
      );
    }),
  );
}
