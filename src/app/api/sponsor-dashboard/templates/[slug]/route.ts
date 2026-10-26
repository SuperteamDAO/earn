import * as Effect from 'effect/Effect';
import type { NextRequest } from 'next/server';

import { json } from '@/lib/route-guard';
import * as ListingTemplates from '@/server/listing-templates';
import { runtime } from '@/server/runtime';

export function GET(
  _: NextRequest,
  { params }: RouteContext<'/api/sponsor-dashboard/templates/[slug]'>,
) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const { slug } = yield* Effect.promise(() => params);
      return yield* ListingTemplates.ListingTemplates.use((templates) =>
        templates.details(slug),
      ).pipe(
        Effect.map((template) =>
          template
            ? json(200, template)
            : json(404, {
                message: `No bounty template found with slug=${slug}.`,
              }),
        ),
        Effect.catchTag('DatabaseError', () =>
          Effect.succeed(
            json(500, {
              message: 'Error occurred while fetching bounty template.',
            }),
          ),
        ),
      );
    }),
  );
}
