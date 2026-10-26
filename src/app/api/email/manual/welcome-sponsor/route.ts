import * as Effect from 'effect/Effect';
import { NextResponse, type NextRequest } from 'next/server';

import { guardUser, json } from '@/lib/route-guard';
import * as ManualEmails from '@/server/manual-emails';
import { runtime } from '@/server/runtime';

// Sent by sponsor onboarding once the sponsor exists.
export function POST(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const writer = yield* guardUser(request);
      if (writer instanceof NextResponse) return writer;
      return yield* ManualEmails.ManualEmails.use((emails) =>
        emails.welcomeSponsor(writer.userId),
      ).pipe(
        Effect.as(json(200, { message: 'Ok' })),
        Effect.catchTags({
          NoUser: () => Effect.succeed(json(400, { error: 'Invalid token' })),
          BlockedAddress: () =>
            Effect.succeed(json(400, { error: 'Blocked Email' })),
          DatabaseError: () =>
            Effect.succeed(json(500, { error: 'Something went wrong.' })),
        }),
      );
    }),
  );
}
