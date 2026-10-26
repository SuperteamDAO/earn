import * as Effect from 'effect/Effect';
import type { NextRequest } from 'next/server';

import { json } from '@/lib/route-guard';
import * as Hackathons from '@/server/hackathons';
import { runtime } from '@/server/runtime';

// A hackathon's prize pool, track count and dates, for its page.
export function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug') ?? '';
  return runtime.runPromise(
    Hackathons.Hackathons.use((hackathons) =>
      hackathons.publicStats(slug),
    ).pipe(
      Effect.map((stats) => json(200, stats)),
      Effect.catchTags({
        HackathonNotFound: () =>
          Effect.succeed(json(404, { error: 'Hackathon not found' })),
        DatabaseError: () =>
          Effect.succeed(json(500, { error: 'Internal Server Error' })),
      }),
    ),
  );
}
