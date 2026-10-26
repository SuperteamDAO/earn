import * as Effect from 'effect/Effect';
import { NextResponse, type NextRequest } from 'next/server';

import { guardSponsor, json } from '@/lib/route-guard';
import * as ReviewAnnounce from '@/server/review-announce';
import { runtime } from '@/server/runtime';

import { refusal } from '../../../submission/refusal';

export const maxDuration = 300;

// Announces the listing's winners.
export function POST(
  request: NextRequest,
  { params }: RouteContext<'/api/sponsor-dashboard/listing/[id]/announce'>,
) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const writer = yield* guardSponsor(request);
      if (writer instanceof NextResponse) return writer;
      const { id } = yield* Effect.promise(() => params);
      return yield* ReviewAnnounce.ReviewAnnounce.use((announce) =>
        announce.announce(writer, id),
      ).pipe(
        Effect.map(() => json(200, { message: 'Success' })),
        Effect.catch((error) => Effect.succeed(refusal(error))),
      );
    }),
  );
}
