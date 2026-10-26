import * as Effect from 'effect/Effect';
import { NextResponse, type NextRequest } from 'next/server';

import { json, readerUser } from '@/lib/route-guard';
import * as Hackathons from '@/server/hackathons';
import { runtime } from '@/server/runtime';

// The dashboard's numbers for their hackathon (or the one named by slug).
export function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug') || undefined;
  return runtime.runPromise(
    Effect.gen(function* () {
      const reader = yield* readerUser(request);
      if (reader instanceof NextResponse) return reader;
      return yield* Hackathons.Hackathons.use((hackathons) =>
        hackathons.sponsorStats({ userId: reader.userId, slug }),
      ).pipe(
        Effect.map((stats) => json(200, stats)),
        Effect.catchTags({
          HackathonNotFound: () =>
            Effect.succeed(json(404, { error: 'Hackathon not found' })),
          DatabaseError: () =>
            Effect.succeed(json(500, { error: 'Internal Server Error' })),
        }),
      );
    }),
  );
}
