import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { NextResponse, type NextRequest } from 'next/server';

import { decodeBody, guardSponsor, json } from '@/lib/route-guard';
import { runtime } from '@/server/runtime';
import * as SponsorVerification from '@/server/sponsor-verification';

const Body = Schema.Record(Schema.String, Schema.Unknown);

// An unverified sponsor's answers before its listing is published (the
// listing builder's verification form).
export function POST(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const writer = yield* guardSponsor(request);
      if (writer instanceof NextResponse) return writer;
      const body = yield* decodeBody(request, Body, 16 * 1024);
      if (body instanceof NextResponse) return body;
      return yield* SponsorVerification.SponsorVerification.use(
        (verification) => verification.submit(writer, body),
      ).pipe(
        Effect.map((sponsor) => json(200, sponsor)),
        Effect.catchTags({
          InvalidVerification: (error) =>
            Effect.succeed(json(400, { message: error.message })),
          ListingNotFound: (error) =>
            Effect.succeed(json(404, { message: error.message })),
          NotVerifying: (error) =>
            Effect.succeed(json(409, { message: error.message })),
          DatabaseError: () =>
            Effect.succeed(
              json(500, {
                error: 'Internal Server Error',
                message: 'Unable to update verification.',
              }),
            ),
        }),
      );
    }),
  );
}
