import * as Effect from 'effect/Effect';
import { NextResponse, type NextRequest } from 'next/server';

import { decodeBody, guardSponsor, json } from '@/lib/route-guard';
import * as ListingBuilder from '@/server/listing-builder';
import { ListingBody } from '@/server/listing-rules';
import { runtime } from '@/server/runtime';

import { LISTING_BODY_LIMIT, refused } from '../../respond';

export function POST(
  request: NextRequest,
  { params }: RouteContext<'/api/sponsor-dashboard/listing/[id]/publish'>,
) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const sponsor = yield* guardSponsor(request);
      if (sponsor instanceof NextResponse) return sponsor;
      const body = yield* decodeBody(request, ListingBody, LISTING_BODY_LIMIT);
      if (body instanceof NextResponse) return body;
      const { id } = yield* Effect.promise(() => params);
      return yield* ListingBuilder.ListingBuilder.use((builder) =>
        builder.publish(sponsor, id, body),
      ).pipe(
        Effect.map((saved) => json(200, saved)),
        Effect.catchTags(refused(id)),
      );
    }),
  );
}
