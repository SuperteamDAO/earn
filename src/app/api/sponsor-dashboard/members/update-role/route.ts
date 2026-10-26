import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { NextResponse, type NextRequest } from 'next/server';

import { decodeBody, guardSponsor, json } from '@/lib/route-guard';
import { runtime } from '@/server/runtime';
import * as TeamMembers from '@/server/team-members';

const Body = Schema.Struct({
  id: Schema.String.check(Schema.isMaxLength(191)),
  role: Schema.Literals(['ADMIN', 'MEMBER']),
});

// Makes a team member an admin or a member (admins, God mode).
export function POST(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const actor = yield* guardSponsor(request);
      if (actor instanceof NextResponse) return actor;
      const body = yield* decodeBody(request, Body, 1024);
      if (body instanceof NextResponse) {
        return body.status === 400
          ? json(400, { error: 'Invalid role update request' })
          : body;
      }
      return yield* TeamMembers.TeamMembers.use((team) =>
        team.updateRole(actor, body.id, body.role),
      ).pipe(
        Effect.map(({ changed }) =>
          json(200, {
            message: changed
              ? 'Role updated successfully.'
              : 'Role already up to date.',
          }),
        ),
        Effect.catchTags({
          OwnRole: (error) =>
            Effect.succeed(json(400, { error: error.message })),
          NotAdmin: () => Effect.succeed(json(403, { error: 'Forbidden' })),
          MemberNotFound: () =>
            Effect.succeed(json(404, { error: 'Member not found' })),
          DatabaseError: () =>
            Effect.succeed(json(500, { error: 'Internal server error' })),
        }),
      );
    }),
  );
}
