import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import type { NextRequest } from 'next/server';

import { json, sessionOf } from '@/lib/route-guard';
import * as LiveLists from '@/server/live-lists';
import { runtime } from '@/server/runtime';
import { parseBoundedIntegerParam } from '@/utils/apiPagination';

// Open listings for the sidebars, soonest deadline first, in the regions
// open to the viewer (only Global ones when signed out).
export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const take = parseBoundedIntegerParam(params.get('take') ?? undefined, {
    defaultValue: 10,
    maxValue: 50,
    name: 'take',
  });
  if (!take.ok) return json(400, { error: take.error });
  const rawDeadline = params.get('deadline');
  const deadline = rawDeadline ? new Date(rawDeadline) : null;
  const query: LiveLists.LiveListingsQuery = {
    take: take.value,
    deadline: deadline && !Number.isNaN(deadline.getTime()) ? deadline : null,
    type: params.get('type') === 'hackathon' ? 'hackathon' : 'bounty',
    excludeIds: [
      ...params.getAll('excludeIds[]'),
      ...params.getAll('excludeIds'),
    ],
    exclusiveSponsorId: params.get('exclusiveSponsorId') || null,
  };
  return runtime.runPromise(
    Effect.gen(function* () {
      const lists = yield* LiveLists.LiveLists;
      const privyDid = yield* sessionOf(request);
      const viewer = Option.isSome(privyDid)
        ? Option.getOrNull(yield* lists.viewer(privyDid.value))
        : null;
      if (viewer?.isBlocked) return json(403, { error: 'User is blocked' });
      return json(200, yield* lists.listings(query, viewer?.location ?? null));
    }).pipe(
      Effect.catchTag('DatabaseError', () =>
        Effect.succeed(
          json(500, {
            error: 'Internal Server Error',
            message: 'Error occurred while fetching listings',
          }),
        ),
      ),
    ),
  );
}
