import * as Effect from 'effect/Effect';
import { NextResponse, type NextRequest } from 'next/server';

import { json, readerSponsor } from '@/lib/route-guard';
import * as LocalProfiles from '@/server/local-profiles';
import { runtime } from '@/server/runtime';

// The chapter's local talent as a CSV download (Local Profiles' Export CSV).
export function GET(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const sponsor = yield* readerSponsor(request);
      if (sponsor instanceof NextResponse) return sponsor;
      return yield* LocalProfiles.LocalProfiles.use((profiles) =>
        profiles.exportCsv(sponsor.userId),
      ).pipe(
        Effect.map(
          ({ fileName, csv }) =>
            new NextResponse(csv, {
              headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="${fileName.replace(/[^\w.-]/g, '_')}.csv"`,
                'Cache-Control': 'no-store',
              },
            }),
        ),
        Effect.catchTags({
          NoChapter: (error) =>
            Effect.succeed(json(400, { error: error.message })),
          NotChapterCore: () =>
            Effect.succeed(json(403, { error: 'Unauthorized' })),
          DatabaseError: () =>
            Effect.succeed(
              json(400, {
                error: 'Internal Server Error',
                message:
                  'Error occurred while exporting users of local region.',
              }),
            ),
        }),
      );
    }),
  );
}
