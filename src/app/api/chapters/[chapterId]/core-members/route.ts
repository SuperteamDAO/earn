import * as Effect from 'effect/Effect';
import { NextResponse, type NextRequest } from 'next/server';

import { json, readerSponsor } from '@/lib/route-guard';
import { runtime } from '@/server/runtime';
import * as SiteChapters from '@/server/site-chapters';

// A chapter's core members, for a sponsor verifying their listing in the
// builder.
export function GET(
  request: NextRequest,
  { params }: RouteContext<'/api/chapters/[chapterId]/core-members'>,
) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const sponsor = yield* readerSponsor(request);
      if (sponsor instanceof NextResponse) return sponsor;
      const { chapterId } = yield* Effect.promise(() => params);
      return yield* SiteChapters.SiteChapters.use((chapters) =>
        chapters.coreMembers(chapterId),
      ).pipe(
        Effect.map((coreMembers) => json(200, { coreMembers })),
        Effect.catchTag('DatabaseError', () =>
          Effect.succeed(
            json(500, { message: 'Failed to fetch core members' }),
          ),
        ),
      );
    }),
  );
}
