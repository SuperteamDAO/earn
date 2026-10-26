import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { NextResponse, type NextRequest } from 'next/server';

import { decodeBody, guardUser, json } from '@/lib/route-guard';
import * as ListingBookmarks from '@/server/listing-bookmarks';
import { runtime } from '@/server/runtime';

const Body = Schema.Struct({ listingId: Schema.NonEmptyString });

// Bookmarks a listing, or undoes the bookmark.
export function POST(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const writer = yield* guardUser(request);
      if (writer instanceof NextResponse) return writer;
      const body = yield* decodeBody(request, Body, 1024);
      if (body instanceof NextResponse) {
        return body.status === 400
          ? json(400, { message: 'Invalid listingId' })
          : body;
      }
      return yield* ListingBookmarks.ListingBookmarks.use((bookmarks) =>
        bookmarks.toggle(writer.userId, body.listingId),
      ).pipe(
        Effect.map((row) => json(200, row)),
        Effect.catchTag('DatabaseError', () =>
          Effect.succeed(
            json(400, {
              error: 'Internal Server Error',
              message: 'Error occurred while toggling bookmark.',
            }),
          ),
        ),
      );
    }),
  );
}
