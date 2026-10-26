import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import type { NextRequest } from 'next/server';

import { json, sessionOf } from '@/lib/route-guard';
import { runtime } from '@/server/runtime';
import * as TalentDirectory from '@/server/talent-directory';

const MAX_COMMENT_SUGGESTIONS = 5;

// People to @-mention in a comment.
export function GET(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const params = request.nextUrl.searchParams;
      const query = params.get('query');
      if (!query) return json(400, { error: 'Query is required' });
      const rawTake = params.get('take');
      const take = rawTake === null ? MAX_COMMENT_SUGGESTIONS : Number(rawTake);
      if (
        !Number.isInteger(take) ||
        take < 1 ||
        take > MAX_COMMENT_SUGGESTIONS
      ) {
        return json(400, {
          error: `take must be an integer between 1 and ${MAX_COMMENT_SUGGESTIONS}`,
        });
      }
      const privyDid = Option.getOrNull(yield* sessionOf(request));
      return yield* TalentDirectory.TalentDirectory.use((directory) =>
        directory.search(query, take, privyDid),
      ).pipe(
        Effect.map((users) => json(200, { users })),
        Effect.catchTags({
          SearchBlocked: () =>
            Effect.succeed(json(403, { error: 'User is blocked' })),
          DatabaseError: () =>
            Effect.succeed(
              json(500, {
                message: 'Error occurred while searching for user.',
              }),
            ),
        }),
      );
    }),
  );
}
