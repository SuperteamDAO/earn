import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { NextResponse, type NextRequest } from 'next/server';

import { decodeBody, guardSponsor, json } from '@/lib/route-guard';
import { runtime } from '@/server/runtime';
import * as SponsorAccounts from '@/server/sponsor-accounts';

const Body = Schema.Record(Schema.String, Schema.Unknown);

const failed = 'Error occurred while updating sponsor.';

// Saves the current sponsor's profile (/earn/dashboard/sponsor/edit/).
export function POST(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const writer = yield* guardSponsor(request);
      if (writer instanceof NextResponse) return writer;
      const body = yield* decodeBody(request, Body);
      if (body instanceof NextResponse) return body;
      return yield* SponsorAccounts.SponsorAccounts.use((accounts) =>
        accounts.edit(writer, body),
      ).pipe(
        Effect.map((sponsor) => json(200, sponsor)),
        Effect.catchTags({
          InvalidSponsor: () =>
            Effect.succeed(json(400, { error: 'Invalid sponsor data' })),
          LogoMissing: (error) =>
            Effect.succeed(json(400, { error: error.message })),
          SponsorTaken: (error) =>
            Effect.succeed(
              json(409, { error: error.message, message: failed }),
            ),
          DatabaseError: () =>
            Effect.succeed(
              json(500, { error: 'Internal Server Error', message: failed }),
            ),
        }),
      );
    }),
  );
}
