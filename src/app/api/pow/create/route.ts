import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { NextResponse, type NextRequest } from 'next/server';

import { decodeBody, guardUser, json } from '@/lib/route-guard';
import * as ProofOfWork from '@/server/proof-of-work';
import { runtime } from '@/server/runtime';

const Body = Schema.Struct({
  pows: Schema.Union([
    ProofOfWork.Project,
    Schema.Array(ProofOfWork.Project).check(Schema.isMaxLength(50)),
  ]),
});

// Adds a project to their proof of work (the profile's "+ADD").
export function POST(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const writer = yield* guardUser(request);
      if (writer instanceof NextResponse) return writer;
      const body = yield* decodeBody(request, Body);
      if (body instanceof NextResponse) return body;
      const projects = Array.isArray(body.pows) ? body.pows : [body.pows];
      return yield* ProofOfWork.ProofOfWork.use((pow) =>
        pow.create(writer.userId, projects),
      ).pipe(
        Effect.as(json(200, { message: 'Success' })),
        Effect.catchTag('DatabaseError', () =>
          Effect.succeed(json(500, { error: 'Internal Server Error' })),
        ),
      );
    }),
  );
}
