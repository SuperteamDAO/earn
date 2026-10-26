import * as Effect from 'effect/Effect';

import { json } from '@/lib/route-guard';
import { runtime } from '@/server/runtime';
import * as SiteChapters from '@/server/site-chapters';

// The chapters' countries (display names), sorted.
export function GET() {
  return runtime.runPromise(
    SiteChapters.SiteChapters.use((chapters) => chapters.countries).pipe(
      Effect.map((countries) => json(200, countries)),
      Effect.catchTag('DatabaseError', () =>
        Effect.succeed(json(500, { error: 'Failed to fetch countries' })),
      ),
    ),
  );
}
