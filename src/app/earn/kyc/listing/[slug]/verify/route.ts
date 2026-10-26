import * as Effect from 'effect/Effect';
import { NextResponse, type NextRequest } from 'next/server';

import { guardUser, json } from '@/lib/route-guard';
import * as ListingKyc from '@/server/listing-kyc';
import { runtime } from '@/server/runtime';

// Asks Sumsub for the verdict on the winner's KYC; once verified, records
// it and sends their winnings for payment (Earn's verify-completion).
export function POST(
  request: NextRequest,
  { params }: RouteContext<'/earn/kyc/listing/[slug]/verify'>,
) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const writer = yield* guardUser(request);
      if (writer instanceof NextResponse) return writer;
      const { slug } = yield* Effect.promise(() => params);
      return yield* ListingKyc.ListingKyc.use((listingKyc) =>
        listingKyc.verify(writer.userId, slug),
      ).pipe(
        Effect.map((result) =>
          typeof result === 'object' && 'notAllowed' in result
            ? json(200, { message: 'Not allowed' })
            : json(200, result),
        ),
        Effect.catchTags({
          LockBusy: () =>
            Effect.succeed(
              json(409, {
                message: 'Payment processing already in progress for this user',
              }),
            ),
          KycUnavailable: () =>
            Effect.succeed(
              json(500, { message: 'Missing environment variables' }),
            ),
          KycSubmissionNotFound: () =>
            Effect.succeed(
              json(404, { message: 'Unable to verify KYC completion.' }),
            ),
          KycError: () =>
            Effect.succeed(
              json(500, { message: 'Unable to verify KYC completion.' }),
            ),
          DatabaseError: () =>
            Effect.succeed(
              json(500, { message: 'Unable to verify KYC completion.' }),
            ),
        }),
      );
    }),
  );
}
