import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { NextResponse, type NextRequest } from 'next/server';

import { decodeBody, guardUser, json } from '@/lib/route-guard';
import { runtime } from '@/server/runtime';
import * as SponsorAccounts from '@/server/sponsor-accounts';

const Body = Schema.Record(Schema.String, Schema.Unknown);

const failed = 'Error occurred while adding a new sponsor.';

// Creates a sponsor with the signed-in account as its admin
// (/earn/new/sponsor/).
export function POST(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const writer = yield* guardUser(request);
      if (writer instanceof NextResponse) return writer;
      const body = yield* decodeBody(request, Body);
      if (body instanceof NextResponse) return body;
      return yield* SponsorAccounts.SponsorAccounts.use((accounts) =>
        accounts.create(writer, body),
      ).pipe(
        Effect.map((sponsor) => json(200, sponsor)),
        Effect.catchTags({
          UserNotFound: () =>
            Effect.succeed(json(404, { error: 'User not found' })),
          InvalidSponsor: () =>
            Effect.succeed(json(403, { error: 'Invalid sponsor data' })),
          LogoMissing: (error) =>
            Effect.succeed(json(400, { error: error.message })),
          AlreadySponsor: () => Effect.succeed(json(400, { message: failed })),
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
