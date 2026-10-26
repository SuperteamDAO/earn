import * as Effect from 'effect/Effect';

import { json } from '@/lib/route-guard';
import { runtime } from '@/server/runtime';
import * as SiteChapters from '@/server/site-chapters';

// Every active chapter; read by listings, grants, search, the builder and
// talent onboarding.
export function GET() {
  return runtime.runPromise(
    SiteChapters.SiteChapters.use((chapters) => chapters.list).pipe(
      Effect.map((list) =>
        json(200, {
          chapters: list.map((chapter) => ({
            id: chapter.id,
            name: chapter.name,
            region: chapter.region,
            displayValue: chapter.displayValue,
            slug: chapter.slug,
            code: chapter.code,
            country: chapter.country,
            icons: chapter.icons || undefined,
            banner: chapter.banner || undefined,
            link: chapter.link || undefined,
            hello: chapter.hello || undefined,
            nationality: chapter.nationality || undefined,
          })),
        }),
      ),
      Effect.catchTag('DatabaseError', () =>
        Effect.succeed(json(500, { error: 'Failed to fetch chapters' })),
      ),
    ),
  );
}
