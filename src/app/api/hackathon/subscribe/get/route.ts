import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { NextResponse, type NextRequest } from 'next/server';

import { decodeBody, json } from '@/lib/route-guard';
import * as Hackathons from '@/server/hackathons';
import { runtime } from '@/server/runtime';

const Body = Schema.Struct({ slug: Schema.String });

// Who's subscribed to a hackathon's updates. A read, posted with the slug
// in the body as Earn's client sends it.
export function POST(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const body = yield* decodeBody(request, Body, 1024);
      if (body instanceof NextResponse) return body;
      return yield* Hackathons.Hackathons.use((hackathons) =>
        hackathons.subscriptions(body.slug),
      ).pipe(
        Effect.map((rows) => json(200, rows)),
        Effect.catchTags({
          HackathonNotFound: () =>
            Effect.succeed(json(404, { message: 'Hackathon not found' })),
          DatabaseError: () =>
            Effect.succeed(
              json(400, {
                error: 'Internal Server Error',
                message: 'Error occurred while fetching subscription status.',
              }),
            ),
        }),
      );
    }),
  );
}
