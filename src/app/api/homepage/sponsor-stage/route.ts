import * as Effect from 'effect/Effect';
import type { NextRequest } from 'next/server';

import { json, readerUser } from '@/lib/route-guard';
import { runtime } from '@/server/runtime';
import * as SponsorStages from '@/server/sponsor-stage';
import * as Users from '@/server/users';

// Where the signed-in sponsor stands: the stage and its listing, or none
// without a current sponsor.
export function GET(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const writer = yield* readerUser(request);
      if (writer instanceof Response) return writer;
      const viewer = yield* Users.Users.use((users) =>
        users.viewer(writer.privyDid),
      );
      const sponsorId =
        viewer._tag === 'Some' ? viewer.value.currentSponsorId : null;
      if (!sponsorId) return json(200, { stage: null, listing: null });
      const { stage, listing } = yield* SponsorStages.SponsorStages.use(
        (stages) => stages.stage(sponsorId),
      );
      return json(200, { stage, listing });
    }).pipe(
      Effect.catchTag('DatabaseError', () =>
        Effect.succeed(
          json(500, {
            error: 'An error occurred while determining the sponsor stage',
          }),
        ),
      ),
    ),
  );
}
