import * as Effect from 'effect/Effect';
import { NextResponse, type NextRequest } from 'next/server';

import { decodeBody, guardUser } from '@/lib/route-guard';
import { ApplicationBody } from '@/server/grant-application-rules';
import * as GrantApplications from '@/server/grant-applications';
import { applicationRefusal } from '@/server/grant-responses';
import { runtime } from '@/server/runtime';

// Applies for a grant.
export function POST(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const writer = yield* guardUser(request);
      if (writer instanceof NextResponse) return writer;
      const body = yield* decodeBody(request, ApplicationBody);
      if (body instanceof NextResponse) return body;
      return yield* applicationRefusal(
        GrantApplications.GrantApplications.use((applications) =>
          applications.create(writer.userId, body),
        ),
        'Unable to submit grant application.',
      );
    }),
  );
}
