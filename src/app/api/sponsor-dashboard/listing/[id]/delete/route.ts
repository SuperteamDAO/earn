import * as Effect from 'effect/Effect';
import { NextResponse, type NextRequest } from 'next/server';

import { guardSponsor, json } from '@/lib/route-guard';
import * as ListingBuilder from '@/server/listing-builder';
import { runtime } from '@/server/runtime';

import { refused } from '../../respond';

// Deletes a draft (the dashboard's listing menu).
export function DELETE(
  request: NextRequest,
  { params }: RouteContext<'/api/sponsor-dashboard/listing/[id]/delete'>,
) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const sponsor = yield* guardSponsor(request);
      if (sponsor instanceof NextResponse) return sponsor;
      const { id } = yield* Effect.promise(() => params);
      return yield* ListingBuilder.ListingBuilder.use((builder) =>
        builder.remove(sponsor, id),
      ).pipe(
        Effect.map(() =>
          json(200, {
            message: `Draft Bounty with id=${id} deleted successfully.`,
          }),
        ),
        Effect.catchTags(refused(id)),
      );
    }),
  );
}
