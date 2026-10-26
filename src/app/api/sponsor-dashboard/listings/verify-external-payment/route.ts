import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { NextResponse, type NextRequest } from 'next/server';

import { decodeBody, guardSponsor, json } from '@/lib/route-guard';
import * as ReviewPayments from '@/server/review-payments';
import { runtime } from '@/server/runtime';

import { refusal } from '../../submission/refusal';

// Each link is checked on-chain, five seconds apart.
export const maxDuration = 300;

const Body = Schema.Struct({
  listingId: Schema.String.check(
    Schema.isMinLength(1),
    Schema.isMaxLength(191),
  ),
  paymentLinks: Schema.Array(
    Schema.Struct({
      submissionId: Schema.String.check(
        Schema.isMinLength(1),
        Schema.isMaxLength(191),
      ),
      link: Schema.optional(Schema.String.check(Schema.isMaxLength(2048))),
      isVerified: Schema.Boolean,
      txId: Schema.String.check(Schema.isMaxLength(500)),
    }),
  ).check(Schema.isMinLength(1), Schema.isMaxLength(100)),
});

// Records payments a sponsor made outside Earn, from their explorer links.
export function POST(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const writer = yield* guardSponsor(request);
      if (writer instanceof NextResponse) return writer;
      const body = yield* decodeBody(request, Body);
      if (body instanceof NextResponse) return body;
      const links = body.paymentLinks.map((link) => ({
        ...link,
        submissionId: link.submissionId.trim(),
        txId: link.txId.trim(),
      }));
      // Earn's request checks: a signature for every unverified link, and
      // 25 at most.
      if (
        links.some((link) => !link.isVerified && !link.txId) ||
        links.filter((link) => link.txId).length > 25
      ) {
        return json(400, { error: 'Invalid request body' });
      }
      return yield* ReviewPayments.ReviewPayments.use((payments) =>
        payments.verifyExternal(writer, body.listingId.trim(), links),
      ).pipe(
        Effect.map((validationResults) => json(200, { validationResults })),
        Effect.catch((error) => Effect.succeed(refusal(error))),
      );
    }),
  );
}
