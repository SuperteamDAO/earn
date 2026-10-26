import 'server-only';

import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import { cache } from 'react';

import { getViewer } from '@/lib/session';
import * as ListingDetails from '@/server/listing-details';
import { runtime } from '@/server/runtime';

import type { PublicListingDetails } from '@/features/listings/types';

// The listing a page shows, once per request (metadata and page alike).
// With `?preview=1`, unpublished too for those who may preview it. null
// when there's none, or it can't be loaded (Earn's error section).
export const listingBySlug = cache(
  async (
    slug: string,
    preview: boolean,
  ): Promise<PublicListingDetails | null> => {
    const viewer = preview ? await getViewer() : null;
    return runtime.runPromise(
      Effect.gen(function* () {
        const details = yield* ListingDetails.ListingDetails;
        const access = viewer
          ? yield* details.previewAccess(viewer.id)
          : ListingDetails.NO_PREVIEW;
        return Option.getOrNull(yield* details.bySlug(slug, access));
      }).pipe(Effect.catchTag('DatabaseError', () => Effect.succeed(null))),
    );
  },
);
