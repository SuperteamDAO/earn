import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { NextResponse, type NextRequest } from 'next/server';

import { decodeBody, guardUser, json } from '@/lib/route-guard';
import { CommentRefType } from '@/prisma/enums';
import * as ListingComments from '@/server/listing-comments';
import { runtime } from '@/server/runtime';

// Earn's UI also sends pocId and replyToUserId; whom to notify is read on
// the server instead, so they're ignored.
const Body = Schema.Struct({
  message: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(5000)),
  refId: Schema.String.check(Schema.isMinLength(1)),
  refType: Schema.Enum(CommentRefType),
  replyToId: Schema.optional(Schema.NullOr(Schema.String)),
  isPinned: Schema.optional(Schema.Boolean),
});

export function POST(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const writer = yield* guardUser(request);
      if (writer instanceof NextResponse) return writer;
      const body = yield* decodeBody(request, Body);
      if (body instanceof NextResponse) return body;
      return yield* ListingComments.ListingComments.use((comments) =>
        comments.create(writer.userId, body),
      ).pipe(
        Effect.map((comment) => json(200, comment)),
        Effect.catchTags({
          PinRefused: (error) =>
            Effect.succeed(json(403, { error: error.reason })),
          CommentNotFound: () =>
            Effect.succeed(
              json(400, {
                message: 'Error occurred while adding a new comment.',
              }),
            ),
          DatabaseError: () =>
            Effect.succeed(
              json(400, {
                message: 'Error occurred while adding a new comment.',
              }),
            ),
        }),
      );
    }),
  );
}
