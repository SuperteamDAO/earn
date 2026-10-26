import * as Effect from 'effect/Effect';
import type { NextRequest } from 'next/server';

import { json } from '@/lib/route-guard';
import * as Hackathons from '@/server/hackathons';
import { runtime } from '@/server/runtime';

// A hackathon's published tracks, richest first.
export function GET(
  _request: NextRequest,
  { params }: RouteContext<'/api/hackathon/[slug]'>,
) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const { slug } = yield* Effect.promise(() => params);
      if (!slug) return json(400, { error: 'Slug is required' });
      const tracks = yield* Hackathons.Hackathons.use((hackathons) =>
        hackathons.tracks(slug),
      );
      return json(200, tracks);
    }).pipe(
      Effect.catchTag('DatabaseError', () =>
        Effect.succeed(json(400, { err: 'Error occurred' })),
      ),
    ),
  );
}
