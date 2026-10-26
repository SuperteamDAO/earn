import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { NextResponse, type NextRequest } from 'next/server';

import { clientIp, decodeBody, fromEarn, json } from '@/lib/route-guard';
import * as ManualEmails from '@/server/manual-emails';
import { runtime } from '@/server/runtime';

const Body = Schema.Struct({
  email: Schema.String,
  subject: Schema.String,
  description: Schema.String,
});

// The support form (components/shared/SupportFormDialog), signed in or not.
export function POST(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      if (!(yield* fromEarn(request))) return json(403, { error: 'origin' });
      const body = yield* decodeBody(request, Body, 64 * 1024);
      if (body instanceof NextResponse) return body;
      return yield* ManualEmails.ManualEmails.use((emails) =>
        emails.support(body, clientIp(request)),
      ).pipe(
        Effect.map((messageId) => json(200, { success: true, messageId })),
        Effect.catchTags({
          InvalidSupportRequest: (error) =>
            Effect.succeed(json(400, { error: error.reason })),
          RateLimited: (error) =>
            Effect.succeed(
              NextResponse.json(
                {
                  message:
                    'Too many requests. Please wait before trying again.',
                  retryAfter: error.retryAfterSeconds,
                },
                {
                  status: 429,
                  headers: { 'Retry-After': String(error.retryAfterSeconds) },
                },
              ),
            ),
          SendFailed: () =>
            Effect.succeed(json(500, { error: 'Failed to send email' })),
        }),
      );
    }),
  );
}
