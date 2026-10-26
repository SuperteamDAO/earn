import * as Effect from 'effect/Effect';
import { NextResponse, type NextRequest } from 'next/server';

import { decodeBody, guardUser, json } from '@/lib/route-guard';
import * as ListingSubmissions from '@/server/listing-submissions';
import { runtime } from '@/server/runtime';

import type { SubmissionMutationResponse } from '@/features/listings/types';

import { SubmissionBody } from '../body';

// Earn answered every refusal alike.
const refused = () =>
  Effect.succeed(
    json(403, {
      error: 'Internal Server Error',
      message: 'Unable to create submission.',
    }),
  );

export function POST(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const writer = yield* guardUser(request);
      if (writer instanceof NextResponse) return writer;
      const body = yield* decodeBody(request, SubmissionBody);
      if (body instanceof NextResponse) return body;
      return yield* ListingSubmissions.ListingSubmissions.use((submissions) =>
        submissions.create(writer.userId, body),
      ).pipe(
        Effect.map((submissionId) =>
          json(200, {
            success: true,
            submissionId,
          } satisfies SubmissionMutationResponse),
        ),
        Effect.catchTags({
          SubmissionRefused: refused,
          InvalidSubmission: refused,
          DatabaseError: refused,
        }),
      );
    }),
  );
}
