import * as Effect from 'effect/Effect';
import { NextResponse, type NextRequest } from 'next/server';

import { json, readerUser } from '@/lib/route-guard';
import * as Hackathons from '@/server/hackathons';
import { runtime } from '@/server/runtime';
import { parseBoundedIntegerParam } from '@/utils/apiPagination';

// The dashboard's hackathon picker: every hackathon matching the search
// (God mode sees them by slug).
export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const take = parseBoundedIntegerParam(params.get('take') ?? undefined, {
    defaultValue: 30,
    maxValue: 100,
    minValue: 1,
    name: 'take',
  });
  if (!take.ok) return json(400, { error: take.error });
  return runtime.runPromise(
    Effect.gen(function* () {
      const reader = yield* readerUser(request);
      if (reader instanceof NextResponse) return reader;
      return yield* Hackathons.Hackathons.use((hackathons) =>
        hackathons.options({
          userId: reader.userId,
          searchString: params.get('searchString') || undefined,
          take: take.value,
        }),
      ).pipe(
        Effect.map((options) => json(200, options)),
        Effect.catchTag('DatabaseError', () =>
          Effect.succeed(
            json(500, {
              error: 'Internal Server Error',
              message: 'Error occurred while fetching hackathons',
            }),
          ),
        ),
      );
    }),
  );
}
