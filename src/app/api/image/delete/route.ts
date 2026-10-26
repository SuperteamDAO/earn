import * as Effect from 'effect/Effect';
import { NextResponse, type NextRequest } from 'next/server';

import { decodeBody, guardUser, json } from '@/lib/route-guard';
import * as ImageUploads from '@/server/image-uploads';
import { runtime } from '@/server/runtime';

// Earn's words for each refusal.
const FORBIDDEN = {
  descriptionUpload: 'You do not have permission to upload listing images',
  descriptionDelete: 'You do not have permission to delete listing images',
  userPhoto: 'Cannot delete image: Image does not match your profile photo',
  sponsorLogo: 'Cannot delete image: Image does not match your sponsor logo',
  sponsorRole: 'You do not have permission to delete sponsor images',
  grant: 'You do not have permission to delete this grant image',
  unknownSource: 'Forbidden',
} as const;

// Deletes an uploaded image its uploader (or owner) no longer wants.
export function DELETE(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const writer = yield* guardUser(request);
      if (writer instanceof NextResponse) return writer;
      const body = yield* decodeBody(
        request,
        ImageUploads.DeleteRequest,
        4 * 1024,
      );
      if (body instanceof NextResponse) {
        return json(400, { error: 'Invalid request body' });
      }
      return yield* ImageUploads.ImageUploads.use((uploads) =>
        uploads.remove(writer.userId, body),
      ).pipe(
        Effect.as(json(200, { message: 'Image deleted successfully' })),
        Effect.catchTags({
          InvalidImageRequest: () =>
            Effect.succeed(
              json(400, {
                error: 'Invalid public ID for the specified source',
              }),
            ),
          ImageUserNotFound: () =>
            Effect.succeed(json(404, { error: 'User not found' })),
          ImageForbidden: (error) =>
            Effect.succeed(json(403, { error: FORBIDDEN[error.reason] })),
          ImageInUse: (error) =>
            Effect.succeed(
              json(409, {
                error:
                  'Cannot delete image: Image is currently being used in a listing description',
                bountyTitle: error.bountyTitle,
                bountyId: error.bountyId,
              }),
            ),
          ImageNotFound: () =>
            Effect.succeed(
              json(404, { error: 'Failed to delete image - it may not exist' }),
            ),
          ImageStoreError: () =>
            Effect.succeed(json(500, { error: 'Internal Server Error' })),
          DatabaseError: () =>
            Effect.succeed(json(500, { error: 'Internal Server Error' })),
        }),
      );
    }),
  );
}
