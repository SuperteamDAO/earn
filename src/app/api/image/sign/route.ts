import * as Effect from 'effect/Effect';
import { NextResponse, type NextRequest } from 'next/server';

import { guardUser, json, readBody } from '@/lib/route-guard';
import * as ImageUploads from '@/server/image-uploads';
import { runtime } from '@/server/runtime';

// Signs a browser's upload straight to Earn's Cloudinary (profile photos,
// sponsor logos, listing images, grant proofs).
export function POST(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const writer = yield* guardUser(request);
      if (writer instanceof NextResponse) return writer;
      const text = yield* readBody(request, 4 * 1024);
      const body: unknown = (() => {
        try {
          return text === null ? null : JSON.parse(text);
        } catch {
          return null;
        }
      })();
      return yield* ImageUploads.ImageUploads.use((uploads) =>
        uploads.sign(writer.userId, body),
      ).pipe(
        Effect.map(({ params, rate }) =>
          NextResponse.json(params, {
            headers: ImageUploads.rateHeaders(rate),
          }),
        ),
        Effect.catchTags({
          UploadRateLimited: (error) =>
            Effect.succeed(
              NextResponse.json(
                {
                  error: error.message,
                  retryAfter: error.retryAfter,
                },
                {
                  status: 429,
                  headers: ImageUploads.rateHeaders(error),
                },
              ),
            ),
          InvalidImageRequest: () =>
            Effect.succeed(json(400, { error: 'Invalid request body' })),
          ImageUserNotFound: () =>
            Effect.succeed(json(404, { error: 'User not found' })),
          ImageForbidden: () =>
            Effect.succeed(
              json(403, {
                error: 'You do not have permission to upload listing images',
              }),
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
