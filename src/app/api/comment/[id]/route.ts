import * as Effect from 'effect/Effect';
import type { NextRequest } from 'next/server';

import { json } from '@/lib/route-guard';
import * as ListingComments from '@/server/listing-comments';
import { runtime } from '@/server/runtime';
import { parseBoundedIntegerParam } from '@/utils/apiPagination';

// A thing's comments, a page at a time (listing pages, the feed).
export async function GET(
  request: NextRequest,
  { params }: RouteContext<'/api/comment/[id]'>,
) {
  const { id } = await params;
  const search = request.nextUrl.searchParams;
  const skip = parseBoundedIntegerParam(search.get('skip') ?? undefined, {
    defaultValue: 0,
    maxValue: 1000,
    name: 'skip',
  });
  if (!skip.ok) return json(400, { error: skip.error });
  const take = parseBoundedIntegerParam(search.get('take') ?? undefined, {
    defaultValue: 10,
    maxValue: 50,
    name: 'take',
  });
  if (!take.ok) return json(400, { error: take.error });

  return runtime.runPromise(
    ListingComments.ListingComments.use((comments) =>
      comments.list(id, { skip: skip.value, take: take.value }),
    ).pipe(
      Effect.map((page) => json(200, page)),
      Effect.catchTag('DatabaseError', () =>
        Effect.succeed(
          json(400, { error: 'Error occurred while fetching comments.' }),
        ),
      ),
    ),
  );
}
