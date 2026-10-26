import * as Effect from 'effect/Effect';
import { NextResponse, type NextRequest } from 'next/server';

import { guardUser, json } from '@/lib/route-guard';
import * as ListingComments from '@/server/listing-comments';
import { runtime } from '@/server/runtime';

const failed = () =>
  Effect.succeed(
    json(400, {
      error: 'Error occurred while deleting a comment.',
      message: 'Internal Server Error',
    }),
  );

// Deletes the author's own comment, and its replies.
export function DELETE(
  request: NextRequest,
  { params }: RouteContext<'/api/comment/[id]/delete'>,
) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const writer = yield* guardUser(request);
      if (writer instanceof NextResponse) return writer;
      const { id } = yield* Effect.promise(() => params);
      return yield* ListingComments.ListingComments.use((comments) =>
        comments.remove(writer.userId, id),
      ).pipe(
        Effect.as(json(200, { message: 'Comment deleted successfully.' })),
        Effect.catchTags({
          NotCommentAuthor: () =>
            Effect.succeed(json(403, { error: 'Unauthorized' })),
          CommentNotFound: failed,
          DatabaseError: failed,
        }),
      );
    }),
  );
}
