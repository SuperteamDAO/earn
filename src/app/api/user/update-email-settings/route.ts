import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { NextResponse, type NextRequest } from 'next/server';

import { decodeBody, guardUser, json } from '@/lib/route-guard';
import * as ProfileWrites from '@/server/profile-writes';
import { runtime } from '@/server/runtime';

const Body = Schema.Struct({
  categories: Schema.Array(Schema.String.check(Schema.isMaxLength(100))).check(
    Schema.isMaxLength(50),
  ),
});

// Which emails they want (the email preferences dialog).
export function POST(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const writer = yield* guardUser(request);
      if (writer instanceof NextResponse) return writer;
      const body = yield* decodeBody(request, Body, 8 * 1024);
      if (body instanceof NextResponse) return body;
      return yield* ProfileWrites.ProfileWrites.use((writes) =>
        writes.emailSettings(writer.userId, body.categories),
      ).pipe(
        Effect.as(
          json(200, { message: 'Email preferences updated successfully!' }),
        ),
        Effect.catchTag('DatabaseError', () =>
          Effect.succeed(json(500, { message: 'Internal server error' })),
        ),
      );
    }),
  );
}
