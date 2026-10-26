import * as Effect from 'effect/Effect';
import { NextResponse, type NextRequest } from 'next/server';

import { json, readerSponsor } from '@/lib/route-guard';
import * as ReviewExports from '@/server/review-exports';
import { runtime } from '@/server/runtime';

import { refusal } from '../refusal';

export const maxDuration = 60;

// A CSV of the listing's submissions on Cloudinary. A GET, as Earn's
// export buttons fetch it; it writes nothing of Earn's.
export function GET(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const writer = yield* readerSponsor(request);
      if (writer instanceof NextResponse) return writer;
      const listingId = request.nextUrl.searchParams.get('listingId');
      if (!listingId) {
        return json(400, { error: 'Missing required parameter: listingId' });
      }
      return yield* ReviewExports.ReviewExports.use((exports) =>
        exports.csv(writer, listingId),
      ).pipe(
        Effect.map((url) => json(200, { url })),
        Effect.catch((error) => Effect.succeed(refusal(error))),
      );
    }),
  );
}
