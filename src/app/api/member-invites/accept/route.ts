import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { NextResponse, type NextRequest } from 'next/server';

import { decodeBody, guardUser, json } from '@/lib/route-guard';
import { runtime } from '@/server/runtime';
import * as TeamInvites from '@/server/team-invites';

const Body = Schema.Struct({
  token: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(256)),
});

// Accepts a team invite for the signed-in account (/earn/signup/).
export function POST(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const writer = yield* guardUser(request);
      if (writer instanceof NextResponse) return writer;
      const body = yield* decodeBody(request, Body, 1024);
      if (body instanceof NextResponse) {
        return body.status === 400
          ? json(400, { error: 'Token or userId is required' })
          : body;
      }
      return yield* TeamInvites.TeamInvites.use((invites) =>
        invites.accept(writer.userId, body.token),
      ).pipe(
        Effect.map(({ message }) => json(200, { message })),
        Effect.catchTags({
          InviteRefused: (error) =>
            Effect.succeed(json(400, { error: error.message })),
          DatabaseError: () =>
            Effect.succeed(json(500, { error: 'Internal server error' })),
        }),
      );
    }),
  );
}
