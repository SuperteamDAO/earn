import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { NextResponse, type NextRequest } from 'next/server';

import { decodeBody, guardUser, json } from '@/lib/route-guard';
import * as Hackathons from '@/server/hackathons';
import { runtime } from '@/server/runtime';

const Body = Schema.Struct({ slug: Schema.String });

// Subscribes the signed-in account to a hackathon's updates, or undoes it.
export function POST(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const writer = yield* guardUser(request);
      if (writer instanceof NextResponse) return writer;
      const body = yield* decodeBody(request, Body, 1024);
      if (body instanceof NextResponse) return body;
      return yield* Hackathons.Hackathons.use((hackathons) =>
        hackathons.toggleSubscription(writer.userId, body.slug),
      ).pipe(
        Effect.map((row) => json(200, row)),
        Effect.catchTags({
          HackathonNotFound: () =>
            Effect.succeed(json(404, { message: 'Hackathon not found' })),
          DatabaseError: () =>
            Effect.succeed(
              json(400, {
                error: 'Internal Server Error',
                message: 'Error occurred while toggling subscription.',
              }),
            ),
        }),
      );
    }),
  );
}
