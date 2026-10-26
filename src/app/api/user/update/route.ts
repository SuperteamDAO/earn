import * as Effect from 'effect/Effect';
import { NextResponse, type NextRequest } from 'next/server';

import { decodeBody, guardUser, json } from '@/lib/route-guard';
import * as ProfileWrites from '@/server/profile-writes';
import { runtime } from '@/server/runtime';

// Account flags (feature modal seen, terms accepted) and switching the
// sponsor they act for.
export function POST(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const writer = yield* guardUser(request);
      if (writer instanceof NextResponse) return writer;
      const body = yield* decodeBody(request, ProfileWrites.AccountBody);
      if (body instanceof NextResponse) return body;
      return yield* ProfileWrites.ProfileWrites.use((writes) =>
        writes.account(writer.userId, body),
      ).pipe(
        Effect.map((viewer) => json(200, viewer)),
        Effect.catchTags({
          ProfileUserMissing: () =>
            Effect.succeed(json(404, { error: 'User not found' })),
          SponsorForbidden: (error) =>
            Effect.succeed(json(403, { error: error.message })),
          NothingToUpdate: (error) =>
            Effect.succeed(json(400, { error: error.message })),
          DatabaseError: () =>
            Effect.succeed(
              json(400, { message: 'Error occurred while updating the user.' }),
            ),
        }),
      );
    }),
  );
}
