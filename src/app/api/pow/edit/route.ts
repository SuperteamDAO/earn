import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { NextResponse, type NextRequest } from 'next/server';

import { decodeBody, guardUser, json } from '@/lib/route-guard';
import * as ProofOfWork from '@/server/proof-of-work';
import { runtime } from '@/server/runtime';

const Body = Schema.Struct({
  pows: Schema.Array(ProofOfWork.Project).check(Schema.isMaxLength(100)),
});

// Saves the edit form's project list as their proof of work.
export function POST(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const writer = yield* guardUser(request);
      if (writer instanceof NextResponse) return writer;
      const body = yield* decodeBody(request, Body);
      if (body instanceof NextResponse) return body;
      return yield* ProofOfWork.ProofOfWork.use((pow) =>
        pow.replace(writer.userId, body.pows),
      ).pipe(
        Effect.as(json(200, { message: 'Success' })),
        Effect.catchTags({
          ProjectsRefused: (error) =>
            Effect.succeed(json(400, { errors: error.errors })),
          DatabaseError: () =>
            Effect.succeed(json(500, { error: 'Internal Server Error' })),
        }),
      );
    }),
  );
}
