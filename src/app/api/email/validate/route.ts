import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { NextResponse, type NextRequest } from 'next/server';

import { clientIp, decodeBody, fromEarn, json } from '@/lib/route-guard';
import * as EmailCheck from '@/server/email-check';
import { runtime } from '@/server/runtime';

const Body = Schema.Struct({
  email: Schema.String.check(Schema.isMaxLength(254)),
});

// Asked by sign-in before Privy sends a code (src/app/(privy)/earn/signin).
export function POST(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      if (!(yield* fromEarn(request))) return json(403, { error: 'origin' });
      const body = yield* decodeBody(request, Body, 1024);
      if (body instanceof NextResponse) return body;
      const email = body.email.trim().toLowerCase();
      return yield* EmailCheck.EmailCheck.use((check) =>
        check.deliverable(email, clientIp(request)),
      ).pipe(
        Effect.map((isValid) => json(200, { isValid })),
        Effect.catchTag('RateLimited', (error) =>
          Effect.succeed(
            NextResponse.json(
              { error: 'rate-limited' },
              {
                status: 429,
                headers: { 'Retry-After': String(error.retryAfterSeconds) },
              },
            ),
          ),
        ),
      );
    }),
  );
}
