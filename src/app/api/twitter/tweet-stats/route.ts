import * as Effect from 'effect/Effect';
import { NextResponse, type NextRequest } from 'next/server';

import { json, readerSponsor } from '@/lib/route-guard';
import { runtime } from '@/server/runtime';
import * as TweetStats from '@/server/tweet-stats';

// A submission's X post stats, for the sponsor reviewing it.
export function GET(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const sponsor = yield* readerSponsor(request);
      if (sponsor instanceof NextResponse) return sponsor;
      const submissionId =
        request.nextUrl.searchParams.get('submissionId')?.trim() ?? '';
      if (!submissionId) {
        return json(400, {
          error: 'Missing or invalid submissionId parameter',
          message: 'Validation failed: Invalid request query parameters',
        });
      }
      return yield* TweetStats.TweetStatsReader.use((stats) =>
        stats.forSubmission(submissionId, sponsor),
      ).pipe(
        Effect.map((stats) => json(200, stats)),
        Effect.catchTags({
          SubmissionNotFound: () =>
            Effect.succeed(
              json(404, {
                error: 'Submission not found',
                message: 'Submission not found',
              }),
            ),
          DatabaseError: () =>
            Effect.succeed(
              json(500, {
                error: 'Internal Server Error',
                message: 'Failed to retrieve submission details',
              }),
            ),
        }),
      );
    }),
  );
}
