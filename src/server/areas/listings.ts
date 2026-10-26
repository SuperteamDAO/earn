import * as Layer from 'effect/Layer';

import * as ListingBookmarks from '@/server/listing-bookmarks';
import * as ListingComments from '@/server/listing-comments';
import * as ListingDetails from '@/server/listing-details';
import * as ListingKyc from '@/server/listing-kyc';
import * as ListingLikes from '@/server/listing-likes';
import * as ListingReports from '@/server/listing-reports';
import * as ListingSubmissions from '@/server/listing-submissions';

// The listings area's services, merged. Each may depend on the shared services
// in src/server/runtime.ts (`shared`) and on this area's own, never on
// another area's.
export const layer = Layer.mergeAll(
  ListingDetails.layer,
  ListingSubmissions.layer,
  ListingComments.layer,
  ListingBookmarks.layer,
  ListingReports.layer,
  ListingKyc.layer,
  ListingLikes.layer,
);
