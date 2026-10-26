import 'server-only';

import * as Effect from 'effect/Effect';

import { json } from '@/lib/route-guard';
import type * as ListingBuilder from '@/server/listing-builder';

// The builder's refusals, as Earn's routes answered them; for
// Effect.catchTags.
export const refused = (id: string | null) => ({
  ListingNotFound: () =>
    Effect.succeed(
      json(404, { error: `Listing with id=${id ?? ''} not found.` }),
    ),
  NotYourListing: () =>
    Effect.succeed(
      json(403, { error: 'User is not authorized to perform this action.' }),
    ),
  ListingRefused: (error: ListingBuilder.ListingRefused) =>
    Effect.succeed(
      json(error.status, {
        error: error.status === 403 ? 'Not Allowed' : error.refusal,
        message: error.refusal,
      }),
    ),
  InvalidListing: (error: ListingBuilder.InvalidListing) =>
    Effect.succeed(
      json(400, { error: 'Invalid listing', errors: error.errors }),
    ),
  DatabaseError: () =>
    Effect.succeed(json(500, { error: 'Internal Server Error' })),
});

// A listing's body can carry a long description.
export const LISTING_BODY_LIMIT = 1024 * 1024;
