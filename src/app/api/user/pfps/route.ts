import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { NextResponse, type NextRequest } from 'next/server';

import { decodeBody, json } from '@/lib/route-guard';
import { runtime } from '@/server/runtime';
import * as TalentDirectory from '@/server/talent-directory';

const Body = Schema.Struct({ id: Schema.String });

// A person's photo, by id (the home page's avatars). A read, sent as a
// POST as Earn always has.
export function POST(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const body = yield* decodeBody(request, Body, 1024);
      if (body instanceof NextResponse) return body;
      if (!body.id) return json(400, { error: 'User ID is required' });
      return yield* TalentDirectory.TalentDirectory.use((directory) =>
        directory.photo(body.id),
      ).pipe(
        Effect.map((user) =>
          user ? json(200, user) : json(404, { error: 'User not found' }),
        ),
        Effect.catchTag('DatabaseError', () =>
          Effect.succeed(json(500, { error: 'Internal Server Error' })),
        ),
      );
    }),
  );
}
