import * as Effect from 'effect/Effect';
import { NextResponse, type NextRequest } from 'next/server';

import { json, readerSponsor } from '@/lib/route-guard';
import * as Hackathons from '@/server/hackathons';
import { runtime } from '@/server/runtime';
import { parseBoundedIntegerParam } from '@/utils/apiPagination';

// A hackathon sponsor's tracks, for their dashboard.
export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const skip = parseBoundedIntegerParam(params.get('skip') ?? undefined, {
    defaultValue: 0,
    maxValue: 1000,
    name: 'skip',
  });
  const take = parseBoundedIntegerParam(params.get('take') ?? undefined, {
    defaultValue: 15,
    maxValue: 50,
    minValue: 1,
    name: 'take',
  });
  if (!skip.ok) return json(400, { error: skip.error });
  if (!take.ok) return json(400, { error: take.error });
  return runtime.runPromise(
    Effect.gen(function* () {
      const sponsor = yield* readerSponsor(request);
      if (sponsor instanceof NextResponse) return sponsor;
      return yield* Hackathons.Hackathons.use((hackathons) =>
        hackathons.sponsorListings({
          hackathonId: sponsor.hackathonId,
          searchText: params.get('searchText') || undefined,
          skip: skip.value,
          take: take.value,
        }),
      ).pipe(
        Effect.map((result) => json(200, result)),
        Effect.catchTags({
          HackathonNotFound: () =>
            Effect.succeed(json(404, { error: 'Hackathon not found.' })),
          DatabaseError: () =>
            Effect.succeed(
              json(400, { err: 'Error occurred while fetching bounties.' }),
            ),
        }),
      );
    }),
  );
}
