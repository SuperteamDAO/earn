import * as Effect from 'effect/Effect';
import type { NextRequest } from 'next/server';

import { json } from '@/lib/route-guard';
import type { BountyType } from '@/prisma/enums';
import * as ListingTemplates from '@/server/listing-templates';
import { runtime } from '@/server/runtime';

const TYPES: ReadonlyArray<BountyType> = ['bounty', 'hackathon'];

// The template picker's templates, by ?type=.
export function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('type');
  const type = TYPES.find((value) => value === raw) ?? null;
  return runtime.runPromise(
    ListingTemplates.ListingTemplates.use((templates) =>
      templates.list(type),
    ).pipe(
      Effect.map((list) =>
        list.length === 0
          ? json(404, {
              message: `No bounty templates found for type=${raw ?? 'undefined'}.`,
            })
          : json(200, list),
      ),
      Effect.catchTag('DatabaseError', () =>
        Effect.succeed(
          json(400, {
            error: 'Internal Server Error',
            message: 'Error occurred while fetching bounties.',
          }),
        ),
      ),
    ),
  );
}
