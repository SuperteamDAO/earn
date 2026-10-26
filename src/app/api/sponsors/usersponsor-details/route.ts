import * as Effect from 'effect/Effect';
import { NextResponse, type NextRequest } from 'next/server';

import { decodeBody, guardUser, json } from '@/lib/route-guard';
import { runtime } from '@/server/runtime';
import * as SponsorMemberDetails from '@/server/sponsor-member-details';

// A sponsor's team member completes their profile (the dashboard's modal,
// sponsor onboarding).
export function POST(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const writer = yield* guardUser(request);
      if (writer instanceof NextResponse) return writer;
      const body = yield* decodeBody(
        request,
        SponsorMemberDetails.Details,
        8 * 1024,
      );
      if (body instanceof NextResponse) {
        return body.status === 400
          ? json(400, { error: 'Invalid user details data' })
          : body;
      }
      return yield* SponsorMemberDetails.SponsorMemberDetails.use((service) =>
        service.complete(writer.userId, body),
      ).pipe(
        Effect.as(json(200, { message: 'Profile updated' })),
        Effect.catchTags({
          InvalidDetails: (error) =>
            Effect.succeed(json(400, { error: error.message })),
          InvalidPhoto: (error) =>
            Effect.succeed(json(400, { error: error.message })),
          DatabaseError: () =>
            Effect.succeed(
              json(500, {
                error: 'Internal server error',
                message: 'Error occurred while updating the user.',
              }),
            ),
        }),
      );
    }),
  );
}
