import * as Effect from 'effect/Effect';
import { NextResponse, type NextRequest } from 'next/server';

import { decodeBody, guardUser, json } from '@/lib/route-guard';
import * as ListingSubmissions from '@/server/listing-submissions';
import { runtime } from '@/server/runtime';

import type { SubmissionMutationResponse } from '@/features/listings/types';

import { SubmissionBody } from '../body';

const failed = (status: number) => () =>
  Effect.succeed(
    json(status, {
      error: 'Internal Server Error',
      message: 'Unable to update submission.',
    }),
  );

export function POST(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const writer = yield* guardUser(request);
      if (writer instanceof NextResponse) return writer;
      const body = yield* decodeBody(request, SubmissionBody);
      if (body instanceof NextResponse) return body;
      if (!body.listingId) {
        return json(400, {
          error: 'Missing required field',
          message: 'Listing ID is required',
        });
      }
      return yield* ListingSubmissions.ListingSubmissions.use((submissions) =>
        submissions.update(writer.userId, body),
      ).pipe(
        Effect.map((submissionId) =>
          json(200, {
            success: true,
            submissionId,
          } satisfies SubmissionMutationResponse),
        ),
        Effect.catchTags({
          InvalidSubmission: failed(400),
          SubmissionRefused: failed(403),
          DatabaseError: failed(403),
        }),
      );
    }),
  );
}
