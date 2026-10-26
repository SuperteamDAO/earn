import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { NextResponse, type NextRequest } from 'next/server';

import { decodeBody, guardSponsor, json } from '@/lib/route-guard';
import * as ReviewPayments from '@/server/review-payments';
import { runtime } from '@/server/runtime';

import { refusal } from '../refusal';

export const maxDuration = 60;

const Body = Schema.Struct({
  id: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(191)),
  paymentDetails: Schema.Array(
    Schema.Struct({
      txId: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(500)),
      amount: Schema.Finite.check(Schema.isGreaterThan(0)),
      tranche: Schema.Int.check(Schema.isGreaterThan(0)),
    }),
  ).check(Schema.isMinLength(1), Schema.isMaxLength(25)),
});

// Records a payment the sponsor sent a winner from their own wallet, once
// it checks out on-chain.
export function POST(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const writer = yield* guardSponsor(request);
      if (writer instanceof NextResponse) return writer;
      const body = yield* decodeBody(request, Body);
      if (body instanceof NextResponse) return body;
      return yield* ReviewPayments.ReviewPayments.use((payments) =>
        payments.addPayment(
          writer,
          body.id.trim(),
          body.paymentDetails.map((payment) => ({
            ...payment,
            txId: payment.txId.trim(),
          })),
        ),
      ).pipe(
        Effect.map((result) => json(200, result)),
        Effect.catch((error) => Effect.succeed(refusal(error))),
      );
    }),
  );
}
