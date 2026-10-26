import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import type { NextRequest } from 'next/server';

import { json, sessionOf } from '@/lib/route-guard';
import { runtime } from '@/server/runtime';
import * as Users from '@/server/users';

// The signed-in account, as pages' viewer has it. For client code that
// still asks; pages get it from the root layout.
export function GET(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const privyDid = yield* sessionOf(request);
      if (Option.isNone(privyDid)) return json(401, { error: 'session' });
      return yield* Users.Users.use((users) =>
        users.viewer(privyDid.value),
      ).pipe(
        Effect.map(
          Option.match({
            onNone: () => json(404, { error: 'User not found' }),
            onSome: (viewer) => json(200, viewer),
          }),
        ),
        Effect.catchTag('DatabaseError', () =>
          Effect.succeed(
            json(500, {
              error: 'Error occurred while processing the request.',
            }),
          ),
        ),
      );
    }),
  );
}
