import * as Effect from 'effect/Effect';
import { NextResponse, type NextRequest } from 'next/server';

import { guardUser, json } from '@/lib/route-guard';
import * as ListingKyc from '@/server/listing-kyc';
import { runtime } from '@/server/runtime';

// A ten-minute Sumsub web SDK token for the signed-in account (bounty and
// grant KYC alike).
export function POST(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const writer = yield* guardUser(request);
      if (writer instanceof NextResponse) return writer;
      return yield* ListingKyc.ListingKyc.use((listingKyc) =>
        listingKyc.accessToken(writer.userId),
      ).pipe(
        Effect.map((token) => json(200, token)),
        Effect.catchTags({
          KycUnavailable: () =>
            Effect.succeed(
              json(500, { message: 'Missing environment variables' }),
            ),
          KycError: () =>
            Effect.succeed(json(500, { message: 'Internal Server Error' })),
        }),
      );
    }),
  );
}
