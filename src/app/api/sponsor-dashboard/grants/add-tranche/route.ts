import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { NextResponse, type NextRequest } from 'next/server';

import { decodeBody, guardSponsor } from '@/lib/route-guard';
import { reviewResponse } from '@/server/grant-responses';
import * as GrantReview from '@/server/grant-review';
import { runtime } from '@/server/runtime';

const Body = Schema.Struct({
  id: Schema.optional(Schema.String),
  trancheAmount: Schema.optional(Schema.Unknown),
  txId: Schema.optional(Schema.String),
});

// Records a payment the sponsor made to a grantee, after checking it on
// chain.
export function POST(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const sponsor = yield* guardSponsor(request);
      if (sponsor instanceof NextResponse) return sponsor;
      const body = yield* decodeBody(request, Body);
      if (body instanceof NextResponse) return body;
      return yield* reviewResponse(
        GrantReview.GrantReview.use((review) =>
          review.recordPayment(sponsor, {
            id: body.id ?? '',
            trancheAmount: body.trancheAmount,
            txId: body.txId ?? '',
          }),
        ),
      );
    }),
  );
}
