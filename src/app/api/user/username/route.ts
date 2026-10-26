import * as Effect from 'effect/Effect';
import { NextResponse, type NextRequest } from 'next/server';

import { json, readerUser } from '@/lib/route-guard';
import { runtime } from '@/server/runtime';
import * as TalentDirectory from '@/server/talent-directory';

// Whether a username is free (or already theirs), as the forms type it.
export function GET(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const reader = yield* readerUser(request);
      if (reader instanceof NextResponse) return reader;
      const username = request.nextUrl.searchParams.get('username');
      if (!username) {
        return json(400, {
          error: 'Username is required and must be a string.',
        });
      }
      return yield* TalentDirectory.TalentDirectory.use((directory) =>
        directory.usernameAvailable(username, reader.userId),
      ).pipe(
        Effect.map((available) => json(200, { available })),
        Effect.catchTag('DatabaseError', () =>
          Effect.succeed(
            json(500, {
              error: 'Error occurred while checking the username availability.',
            }),
          ),
        ),
      );
    }),
  );
}
