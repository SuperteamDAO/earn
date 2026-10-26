import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { NextResponse, type NextRequest } from 'next/server';

import { decodeBody, guardUser, json } from '@/lib/route-guard';
import * as GrantApplications from '@/server/grant-applications';
import { runtime } from '@/server/runtime';

const Body = Schema.Struct({ id: Schema.optional(Schema.String) });

// Likes or unlikes a grant application (the feed).
export function POST(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const writer = yield* guardUser(request);
      if (writer instanceof NextResponse) return writer;
      const body = yield* decodeBody(request, Body);
      if (body instanceof NextResponse) return body;
      const { id } = body;
      if (!id) return json(400, { message: 'Grant ID is required.' });
      return yield* GrantApplications.GrantApplications.use((applications) =>
        applications.like(writer.userId, id),
      ).pipe(
        Effect.as(
          json(200, { data: { ok: true }, message: 'Operation successful' }),
        ),
        Effect.catchTag('DatabaseError', () =>
          Effect.succeed(
            json(500, {
              error: 'Internal Server Error',
              message: 'Error occurred while updating submission like.',
            }),
          ),
        ),
      );
    }),
  );
}
