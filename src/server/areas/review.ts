import * as Layer from 'effect/Layer';

import * as Review from '@/server/review';
import * as ReviewAirtable from '@/server/review-airtable';
import * as ReviewAnnounce from '@/server/review-announce';
import * as ReviewBackground from '@/server/review-background';
import * as ReviewChain from '@/server/review-chain';
import * as ReviewExports from '@/server/review-exports';
import * as ReviewPayments from '@/server/review-payments';

// The review area's services, merged. Each may depend on the shared services
// in src/server/runtime.ts (`shared`) and on this area's own, never on
// another area's.
export const layer = Layer.mergeAll(
  Review.layer,
  ReviewExports.layer,
  ReviewPayments.layer.pipe(Layer.provide(ReviewChain.layer)),
  ReviewAnnounce.layer.pipe(
    Layer.provide(ReviewAirtable.layer),
    Layer.provide(ReviewBackground.layer),
  ),
);
