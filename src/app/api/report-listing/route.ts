import * as Effect from 'effect/Effect';
import { NextResponse, type NextRequest } from 'next/server';

import { guardUser, json, readBody } from '@/lib/route-guard';
import * as ListingReports from '@/server/listing-reports';
import { runtime } from '@/server/runtime';

const parse = (text: string | null): unknown => {
  if (text === null) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

// Reports a listing to the moderators (earncognito's Telegram bot).
export function POST(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const writer = yield* guardUser(request);
      if (writer instanceof NextResponse) return writer;
      const body = parse(yield* readBody(request, 16 * 1024));
      return yield* ListingReports.ListingReports.use((reports) =>
        reports.report(writer.userId, body),
      ).pipe(
        Effect.as(
          json(200, {
            ok: true,
            message: 'Report notification sent successfully.',
          }),
        ),
        Effect.catchTags({
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
          ReporterWithoutEmail: () =>
            Effect.succeed(
              json(400, {
                error:
                  'Authenticated user email is required to report listings',
              }),
            ),
          InvalidReport: () =>
            Effect.succeed(json(400, { error: 'Invalid payload' })),
          EarncognitoError: (error) =>
            Effect.succeed(
              error.status
                ? json(error.status, { error: 'Upstream error' })
                : json(500, { error: 'Internal Server Error' }),
            ),
          DatabaseError: () =>
            Effect.succeed(json(500, { error: 'Internal Server Error' })),
        }),
      );
    }),
  );
}
