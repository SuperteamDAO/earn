import * as Effect from 'effect/Effect';
import { NextResponse, type NextRequest } from 'next/server';

import { decodeBody, guardUser, json } from '@/lib/route-guard';
import * as ProfileWrites from '@/server/profile-writes';
import { runtime } from '@/server/runtime';

import { ProfileBody } from '@/features/talent/utils/profile-input';

// Saves the edit profile form: only the fields it changed.
export function POST(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const writer = yield* guardUser(request);
      if (writer instanceof NextResponse) return writer;
      const body = yield* decodeBody(request, ProfileBody);
      if (body instanceof NextResponse) return body;
      return yield* ProfileWrites.ProfileWrites.use((writes) =>
        writes.edit(writer.userId, body),
      ).pipe(
        Effect.map((saved) => json(200, saved)),
        Effect.catchTags({
          ProfileUserMissing: () =>
            Effect.succeed(json(404, { error: 'User not found' })),
          PhotoMissing: (error) =>
            Effect.succeed(json(400, { error: error.message })),
          InvalidProfile: (error) =>
            Effect.succeed(
              json(422, {
                message: 'Invalid profile data',
                errors: { formErrors: [], fieldErrors: error.errors },
              }),
            ),
          DatabaseError: () =>
            Effect.succeed(
              json(500, { error: 'Error updating user profile.' }),
            ),
        }),
      );
    }),
  );
}
