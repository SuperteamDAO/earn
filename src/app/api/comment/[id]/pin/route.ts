import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { NextResponse, type NextRequest } from 'next/server';

import { decodeBody, guardUser, json } from '@/lib/route-guard';
import * as ListingComments from '@/server/listing-comments';
import { runtime } from '@/server/runtime';

const Body = Schema.Struct({ isPinned: Schema.Boolean });

// Pins or unpins a top-level comment; the listing's poc only.
export function POST(
  request: NextRequest,
  { params }: RouteContext<'/api/comment/[id]/pin'>,
) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const writer = yield* guardUser(request);
      if (writer instanceof NextResponse) return writer;
      const body = yield* decodeBody(request, Body, 1024);
      if (body instanceof NextResponse) {
        return body.status === 400
          ? json(400, { error: 'isPinned must be a boolean value' })
          : body;
      }
      const { id } = yield* Effect.promise(() => params);
      return yield* ListingComments.ListingComments.use((comments) =>
        comments.pin(writer.userId, id, body.isPinned),
      ).pipe(
        Effect.map((comment) => json(200, comment)),
        Effect.catchTags({
          CommentNotFound: () =>
            Effect.succeed(json(404, { error: 'Comment not found' })),
          PinRefused: (error) =>
            Effect.succeed(
              json(error.reason === 'Cannot pin replies' ? 400 : 403, {
                error: error.reason,
              }),
            ),
          DatabaseError: () =>
            Effect.succeed(
              json(400, {
                error: 'Error occurred while pinning/unpinning comment.',
                message: 'Internal Server Error',
              }),
            ),
        }),
      );
    }),
  );
}
