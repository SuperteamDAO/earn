import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';
import type { NextRequest } from 'next/server';

import { json, sessionOf } from '@/lib/route-guard';
import * as Hackathons from '@/server/hackathons';
import { runtime } from '@/server/runtime';

// Missing parameters take Earn's defaults; a wrong one is refused.
const decodeQuery = Schema.decodeUnknownOption(Hackathons.HackathonListQuery);

// Hackathon tracks for the hackathon list: by hackathon name, status and
// sort, in the viewer's regions when they have a profile.
export function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const query = decodeQuery({ ...Hackathons.DEFAULT_LIST_QUERY, ...params });
  if (Option.isNone(query)) {
    return json(400, { message: 'Invalid query parameters' });
  }
  return runtime.runPromise(
    Effect.gen(function* () {
      const hackathons = yield* Hackathons.Hackathons;
      const privyDid = yield* sessionOf(request);
      const viewer = Option.isSome(privyDid)
        ? Option.getOrNull(yield* hackathons.regionViewer(privyDid.value))
        : null;
      const listings = yield* hackathons.list(query.value, viewer);
      return json(200, listings);
    }).pipe(
      Effect.catchTag('DatabaseError', () =>
        Effect.succeed(json(500, { message: 'Internal Server Error' })),
      ),
    ),
  );
}
