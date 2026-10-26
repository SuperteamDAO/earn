import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import type { NextRequest } from 'next/server';

import { json, sessionOf } from '@/lib/route-guard';
import { runtime } from '@/server/runtime';
import * as TalentFeed from '@/server/talent-feed';
import { parseBoundedIntegerParam } from '@/utils/apiPagination';

import { parseFeedPostType } from '@/features/feed/types';

// "Load more" for the activity feed and talent profiles, and the feed's
// time filter: Earn's /api/feed/get, same query and answer.
export function GET(request: NextRequest) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const params = request.nextUrl.searchParams;
      const get = (name: string) => params.get(name) ?? undefined;
      const take = parseBoundedIntegerParam(get('take'), {
        defaultValue: 15,
        maxValue: 30,
        name: 'take',
      });
      if (!take.ok) return json(400, { error: take.error });
      const skip = parseBoundedIntegerParam(get('skip'), {
        defaultValue: 0,
        maxValue: 1000,
        name: 'skip',
      });
      if (!skip.ok) return json(400, { error: skip.error });

      const filter = get('filter');
      const privyDid = yield* sessionOf(request);
      return yield* TalentFeed.TalentFeed.use((feed) =>
        feed.list(
          {
            filter:
              filter === 'popular' || filter === 'new' ? filter : undefined,
            timePeriod: get('timePeriod'),
            isWinner: get('isWinner') === 'true',
            take: take.value,
            skip: skip.value,
            userId: get('userId'),
            highlightId: get('highlightId'),
            highlightType: parseFeedPostType(get('highlightType')),
            takeOnlyType: parseFeedPostType(get('takeOnlyType')),
          },
          Option.getOrNull(privyDid),
        ),
      ).pipe(
        Effect.map((items) => json(200, items)),
        Effect.catchTag('DatabaseError', () =>
          Effect.succeed(json(500, { error: 'Unable to fetch data.' })),
        ),
      );
    }),
  );
}
