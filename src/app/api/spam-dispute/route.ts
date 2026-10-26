import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { NextResponse, type NextRequest } from 'next/server';

import { decodeBody, guardUser, json } from '@/lib/route-guard';
import { runtime } from '@/server/runtime';
import * as SpamDisputes from '@/server/spam-disputes';

const Body = Schema.Struct({
  description: Schema.String.check(Schema.isMinLength(10)),
  listingType: Schema.String.check(Schema.isMinLength(1)),
  submissionId: Schema.String.check(Schema.isMinLength(1)),
});

const REFUSALS = {
  duplicate: 'A dispute has already been submitted for this submission',
  'no-penalty': 'No spam penalty found for this submission',
  expired: 'The deadline for disputing this spam penalty has passed (7 days)',
} as const;

// Talent disputing a spam penalty from the credit drawer.
export function POST(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const writer = yield* guardUser(request);
      if (writer instanceof NextResponse) return writer;
      const body = yield* decodeBody(request, Body);
      if (body instanceof NextResponse) {
        return json(400, { error: 'Invalid payload' });
      }
      return yield* SpamDisputes.SpamDisputes.use((disputes) =>
        disputes.dispute(writer.userId, body),
      ).pipe(
        Effect.as(
          json(200, {
            success: true,
            message: 'Spam dispute submitted successfully',
          }),
        ),
        Effect.catchTags({
          DisputeRefused: (error) =>
            Effect.succeed(json(400, { error: REFUSALS[error.reason] })),
          EarncognitoError: (error) =>
            Effect.logError('Error sending spam dispute notification').pipe(
              Effect.as(
                error.status && error.status >= 400
                  ? json(error.status, {
                      error: 'Failed to send dispute notification',
                    })
                  : json(500, { error: 'Internal server error' }),
              ),
            ),
          DatabaseError: () =>
            Effect.succeed(json(500, { error: 'Internal server error' })),
        }),
      );
    }),
  );
}
