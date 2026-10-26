import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { NextResponse, type NextRequest } from 'next/server';

import { decodeBody, guardUser, json } from '@/lib/route-guard';
import * as OgImages from '@/server/og-images';
import { runtime } from '@/server/runtime';

import { rateLimited } from '../rate-limited';

// Only the record's identity: the image is read from its link here.
const Body = Schema.Struct({
  type: OgImages.OgImageTarget,
  id: Schema.String.check(
    Schema.makeFilter(
      (value: string) =>
        (value.trim().length > 0 && value.length <= 64) || 'id',
    ),
  ),
});

const invalid = () =>
  json(400, { success: false, error: 'Invalid request body' });

// Stores a submission's or project's preview image the first time anyone
// sees its card.
export function POST(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const writer = yield* guardUser(request);
      if (writer instanceof NextResponse) return writer;
      const body = yield* decodeBody(request, Body, 1024);
      if (body instanceof NextResponse) return invalid();
      return yield* OgImages.OgImages.use((og) =>
        og.update(writer.userId, body.type, body.id),
      ).pipe(
        Effect.map((imageUrl) => json(200, { success: true, imageUrl })),
        Effect.catchTags({
          RateLimited: (error) => Effect.succeed(rateLimited(error)),
          OgRecordNotFound: () =>
            Effect.succeed(
              json(404, { success: false, error: 'Record not found' }),
            ),
          OgImageExists: () =>
            Effect.succeed(
              json(409, { success: false, error: 'Image already exists' }),
            ),
          OgNoSource: () =>
            Effect.succeed(
              json(422, { success: false, error: 'Record has no source URL' }),
            ),
          DatabaseError: () =>
            Effect.succeed(
              json(500, { success: false, error: 'Internal Server Error' }),
            ),
        }),
      );
    }),
  );
}
