import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { NextResponse, type NextRequest } from 'next/server';

import { decodeBody, guardUser, json } from '@/lib/route-guard';
import * as GrantApplications from '@/server/grant-applications';
import { runtime } from '@/server/runtime';

const Body = Schema.Struct({ applicationId: Schema.String });

const FAILED = { message: 'Unable to verify KYC completion.' };

// Asks Sumsub for the verdict on their KYC (Earn's verify-completion); a
// POST, as it records the KYC and the first tranche.
export function POST(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const writer = yield* guardUser(request);
      if (writer instanceof NextResponse) return writer;
      const body = yield* decodeBody(request, Body, 1024);
      if (body instanceof NextResponse) return body;
      return yield* GrantApplications.GrantApplications.use((applications) =>
        applications.kycVerify(writer.userId, body.applicationId),
      ).pipe(
        Effect.map((result) => json(200, result)),
        Effect.catchTags({
          LockBusy: () =>
            Effect.succeed(
              json(409, {
                message:
                  'First tranche creation already in progress for this application',
              }),
            ),
          KycUnavailable: () =>
            Effect.succeed(
              json(500, { message: 'Missing environment variables' }),
            ),
          NotFound: () => Effect.succeed(json(500, FAILED)),
          KycError: () => Effect.succeed(json(500, FAILED)),
          TrancheRefused: () => Effect.succeed(json(500, FAILED)),
          DatabaseError: () => Effect.succeed(json(500, FAILED)),
        }),
      );
    }),
  );
}
