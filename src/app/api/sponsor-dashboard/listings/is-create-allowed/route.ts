import * as Effect from 'effect/Effect';
import { NextResponse, type NextRequest } from 'next/server';

import { json, readerSponsor } from '@/lib/route-guard';
import * as ListingBuilder from '@/server/listing-builder';
import { runtime } from '@/server/runtime';

// Whether the current sponsor may create a listing: not with five or more
// past their deadline without winners.
export function GET(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const sponsor = yield* readerSponsor(request);
      if (sponsor instanceof NextResponse) return sponsor;
      return yield* ListingBuilder.ListingBuilder.use((builder) =>
        builder.createAllowed(sponsor.sponsorId),
      ).pipe(
        Effect.map((allowed) => json(200, { allowed })),
        Effect.catchTag('DatabaseError', () =>
          Effect.succeed(
            json(400, {
              err: 'Error checking if sponsor is allowed to create more listings:',
            }),
          ),
        ),
      );
    }),
  );
}
