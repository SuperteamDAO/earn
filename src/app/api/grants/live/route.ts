import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import type { NextRequest } from 'next/server';

import { json, sessionOf } from '@/lib/route-guard';
import * as LiveLists from '@/server/live-lists';
import { runtime } from '@/server/runtime';
import { parseBoundedIntegerParam } from '@/utils/apiPagination';

// Live grants for the sidebars, newest first; signed in, those open to
// the viewer's region.
export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const take = parseBoundedIntegerParam(params.get('take') ?? undefined, {
    defaultValue: 100,
    maxValue: 100,
    name: 'take',
  });
  if (!take.ok) return json(400, { error: take.error });
  const query: LiveLists.LiveGrantsQuery = {
    take: take.value,
    excludeIds: [
      ...params.getAll('excludeIds[]'),
      ...params.getAll('excludeIds'),
    ],
  };
  return runtime.runPromise(
    Effect.gen(function* () {
      const lists = yield* LiveLists.LiveLists;
      const privyDid = yield* sessionOf(request);
      const viewer = Option.isSome(privyDid)
        ? Option.getOrNull(yield* lists.viewer(privyDid.value))
        : null;
      if (viewer?.isBlocked) return json(403, { error: 'User is blocked' });
      // A session with no Earn account yet is treated as signed in, as
      // Earn did: only Global grants.
      const regionViewer = Option.isSome(privyDid)
        ? { location: viewer?.location ?? null }
        : null;
      return json(200, yield* lists.grants(query, regionViewer));
    }).pipe(
      Effect.catchTag('DatabaseError', () =>
        Effect.succeed(
          json(400, { err: 'Error occurred while fetching grants.' }),
        ),
      ),
    ),
  );
}
