import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { NextResponse, type NextRequest } from 'next/server';

import { decodeBody, guardUser, json } from '@/lib/route-guard';
import * as ProofOfWork from '@/server/proof-of-work';
import { runtime } from '@/server/runtime';

const Body = Schema.Struct({ id: Schema.String });

// Likes a project in the feed, or takes the like back.
export function POST(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const writer = yield* guardUser(request);
      if (writer instanceof NextResponse) return writer;
      const body = yield* decodeBody(request, Body, 1024);
      if (body instanceof NextResponse) return body;
      if (!body.id) {
        return json(400, { error: 'PoW ID is required in the request body' });
      }
      return yield* ProofOfWork.ProofOfWork.use((pow) =>
        pow.toggleLike(writer.userId, body.id),
      ).pipe(
        Effect.as(
          json(200, { data: { ok: true }, message: 'Operation successful' }),
        ),
        Effect.catchTags({
          LikeTargetMissing: () =>
            Effect.succeed(json(404, { error: 'PoW not found' })),
          DatabaseError: () =>
            Effect.succeed(
              json(500, {
                error: 'Internal Server Error',
                message: 'Error occurred while updating PoW like',
              }),
            ),
        }),
      );
    }),
  );
}
