import * as Effect from 'effect/Effect';
import { NextResponse, type NextRequest } from 'next/server';

import { json, readerSponsor } from '@/lib/route-guard';
import * as Review from '@/server/review';
import { runtime } from '@/server/runtime';

import { refusal } from '../../../submission/refusal';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// How many of the listing's winners are paid.
export function GET(
  request: NextRequest,
  {
    params,
  }: RouteContext<'/api/sponsor-dashboard/listing/[id]/total-payments-made'>,
) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const { id } = yield* Effect.promise(() => params);
      if (!UUID.test(id)) return json(400, { error: 'Invalid listing ID' });
      const writer = yield* readerSponsor(request);
      if (writer instanceof NextResponse) return writer;
      return yield* Review.Review.use((review) =>
        review.totalPaymentsMade(writer, id),
      ).pipe(
        Effect.map((totalPaymentsMade) =>
          json(200, { listingId: id, totalPaymentsMade }),
        ),
        Effect.catch((error) => Effect.succeed(refusal(error))),
      );
    }),
  );
}
