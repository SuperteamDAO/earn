import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import type { NextRequest } from 'next/server';

import { json, sessionOf } from '@/lib/route-guard';
import * as ListingDetails from '@/server/listing-details';
import { runtime } from '@/server/runtime';
import * as Users from '@/server/users';
import { parseBoundedIntegerParam } from '@/utils/apiPagination';

// Live listings like this one, for the viewer's region.
export function GET(
  request: NextRequest,
  { params }: RouteContext<'/api/listings/[listingId]/related'>,
) {
  return runtime.runPromise(
    Effect.gen(function* () {
      const { listingId } = yield* Effect.promise(() => params);
      const take = parseBoundedIntegerParam(
        request.nextUrl.searchParams.get('take') ?? undefined,
        { defaultValue: 5, maxValue: 20, name: 'take' },
      );
      if (!take.ok) return json(400, { error: take.error });
      const privyDid = yield* sessionOf(request);
      const viewer = Option.isSome(privyDid)
        ? Option.getOrNull(
            yield* Users.Users.use((users) => users.viewer(privyDid.value)),
          )
        : null;
      if (viewer?.isBlocked) return json(403, { error: 'User is blocked' });
      return yield* ListingDetails.ListingDetails.use((details) =>
        details.related(listingId, viewer?.location ?? null, take.value),
      ).pipe(Effect.map((listings) => json(200, listings)));
    }).pipe(
      Effect.catchTag('DatabaseError', () =>
        Effect.succeed(json(500, { error: 'Internal server error' })),
      ),
    ),
  );
}
