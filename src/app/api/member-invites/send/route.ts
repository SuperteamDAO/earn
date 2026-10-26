import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { NextResponse, type NextRequest } from 'next/server';

import { decodeBody, guardSponsor, json } from '@/lib/route-guard';
import { runtime } from '@/server/runtime';
import * as TeamInvites from '@/server/team-invites';

const Body = Schema.Struct({
  email: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(254)),
  memberType: Schema.Literals(['ADMIN', 'MEMBER']),
});

const failed = () =>
  Effect.succeed(
    json(500, {
      error: 'Internal Server Error',
      message: 'Error occurred while sending the invite.',
    }),
  );

// Invites someone by email to the current sponsor's team.
export function POST(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const actor = yield* guardSponsor(request);
      if (actor instanceof NextResponse) return actor;
      const body = yield* decodeBody(request, Body, 1024);
      if (body instanceof NextResponse) {
        return body.status === 400
          ? json(400, { error: 'Email and member type are required.' })
          : body;
      }
      return yield* TeamInvites.TeamInvites.use((invites) =>
        invites.send(actor, body),
      ).pipe(
        Effect.as(json(200, { message: 'Invite sent successfully.' })),
        Effect.catchTags({
          InviteNotAdmin: () =>
            Effect.succeed(json(403, { error: 'Unauthorized' })),
          BlockedEmail: () =>
            Effect.succeed(json(400, { error: 'Blocked Email' })),
          InviteMailFailed: failed,
          DatabaseError: failed,
        }),
      );
    }),
  );
}
