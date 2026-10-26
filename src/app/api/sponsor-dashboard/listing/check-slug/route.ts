import * as Effect from 'effect/Effect';
import type { NextRequest } from 'next/server';

import { json } from '@/lib/route-guard';
import * as ListingBuilder from '@/server/listing-builder';
import { runtime } from '@/server/runtime';

// ?check=true: whether a slug is taken (400 when it is); otherwise a free
// slug made from ?slug=.
export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const slug = params.get('slug');
  const id = params.get('id') || null;
  if (!slug) {
    return json(400, { error: 'Slug is required and must be a string' });
  }
  return runtime.runPromise(
    ListingBuilder.ListingBuilder.use((builder) =>
      params.get('check') === 'true'
        ? builder.slugTaken(slug, id).pipe(
            Effect.map((taken) =>
              taken
                ? json(400, {
                    slugExists: true,
                    error: 'Slug already exists',
                  })
                : json(200, { slugExists: false }),
            ),
          )
        : builder
            .uniqueSlug(slug, id)
            .pipe(Effect.map((free) => json(200, { slug: free }))),
    ).pipe(
      Effect.catchTag('DatabaseError', () =>
        Effect.succeed(json(500, { error: 'Internal server error' })),
      ),
    ),
  );
}
