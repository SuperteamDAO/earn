import * as Effect from 'effect/Effect';
import { NextResponse, type NextRequest } from 'next/server';

import { guardSponsor, json } from '@/lib/route-guard';
import * as ListingBuilder from '@/server/listing-builder';
import { runtime } from '@/server/runtime';

import { refused } from '../../respond';

// Takes a live listing down (the dashboard's listing menu).
export function POST(
  request: NextRequest,
  { params }: RouteContext<'/api/sponsor-dashboard/listing/[id]/unpublish'>,
) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const sponsor = yield* guardSponsor(request);
      if (sponsor instanceof NextResponse) return sponsor;
      const { id } = yield* Effect.promise(() => params);
      return yield* ListingBuilder.ListingBuilder.use((builder) =>
        builder.unpublish(sponsor, id),
      ).pipe(
        Effect.map((listing) => json(200, listing)),
        Effect.catchTags(refused(id)),
      );
    }),
  );
}
