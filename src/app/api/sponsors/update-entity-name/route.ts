import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { NextResponse, type NextRequest } from 'next/server';

import { decodeBody, guardSponsor, json } from '@/lib/route-guard';
import { runtime } from '@/server/runtime';
import * as SponsorAccounts from '@/server/sponsor-accounts';

const Body = Schema.Struct({ entityName: Schema.String });

// The entity-name modal: who legally controls the current sponsor.
export function POST(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const writer = yield* guardSponsor(request);
      if (writer instanceof NextResponse) return writer;
      const body = yield* decodeBody(request, Body, 4096);
      if (body instanceof NextResponse) return body;
      return yield* SponsorAccounts.SponsorAccounts.use((accounts) =>
        accounts.updateEntityName(writer, body.entityName),
      ).pipe(
        Effect.map((sponsor) => json(200, sponsor)),
        Effect.catchTag('DatabaseError', () =>
          Effect.succeed(
            json(500, {
              error: 'Internal Server Error',
              message: 'Error occurred while updating sponsor.',
            }),
          ),
        ),
      );
    }),
  );
}
