import * as Effect from 'effect/Effect';
import type { NextRequest } from 'next/server';

import { json, readerUser } from '@/lib/route-guard';
import * as LiveLists from '@/server/live-lists';
import { runtime } from '@/server/runtime';
import { parseBoundedIntegerParam } from '@/utils/apiPagination';

// The signed-in talent's bookmarked listings, newest first.
export function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('take') ?? undefined;
  const take = parseBoundedIntegerParam(raw, {
    defaultValue: 50,
    maxValue: 100,
    minValue: 1,
    name: 'take',
  });
  if (!take.ok) return json(400, { error: take.error });
  return runtime.runPromise(
    Effect.gen(function* () {
      const writer = yield* readerUser(request);
      if (writer instanceof Response) return writer;
      const listings = yield* LiveLists.LiveLists.use((lists) =>
        lists.bookmarks(writer.userId, raw ? take.value : undefined),
      );
      return json(200, listings);
    }).pipe(
      Effect.catchTag('DatabaseError', () =>
        Effect.succeed(
          json(500, {
            error: 'Internal Server Error',
            message: 'Error occurred while fetching bookmarks.',
          }),
        ),
      ),
    ),
  );
}
