import 'server-only';

import { json } from '@/lib/route-guard';
import type * as Database from '@/server/database';
import type * as Review from '@/server/review';
import type * as ReviewAnnounce from '@/server/review-announce';
import type * as ReviewExports from '@/server/review-exports';

type ReviewError =
  | Review.ReviewInvalid
  | Review.SubmissionsNotFound
  | Review.ListingNotFound
  | Review.NotYourListing
  | ReviewAnnounce.AlreadyAnnounced
  | ReviewExports.ExportFailed
  | Database.DatabaseError;

// The review routes' refusals, with Earn's statuses and messages (`error`
// and `message`, as Earn's handlers answered).
export function refusal(error: ReviewError) {
  switch (error._tag) {
    case 'ReviewInvalid':
      return json(400, { error: error.message, message: error.message });
    case 'SubmissionsNotFound':
    case 'ListingNotFound':
      return json(404, { error: error.message, message: error.message });
    case 'NotYourListing':
      return json(403, { error: error.message });
    case 'AlreadyAnnounced':
      return json(409, { error: error.message });
    case 'ExportFailed':
      return json(400, {
        error: 'Internal Server Error',
        message: 'Error occurred while exporting submissions.',
      });
    default:
      return json(500, { error: 'Internal Server Error' });
  }
}
