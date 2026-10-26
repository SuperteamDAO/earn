import * as Layer from 'effect/Layer';

import * as GrantAirtable from '@/server/grant-airtable';
import * as GrantApplications from '@/server/grant-applications';
import * as GrantPages from '@/server/grant-pages';
import * as GrantPayments from '@/server/grant-payments';
import * as GrantReview from '@/server/grant-review';
import * as GrantSheets from '@/server/grant-sheets';
import * as GrantTranches from '@/server/grant-tranches';

// The grants area's services, merged. Each may depend on the shared services
// in src/server/runtime.ts (`shared`) and on this area's own, never on
// another area's.
const tranches = GrantTranches.layer.pipe(Layer.provide(GrantAirtable.layer));

const base = Layer.mergeAll(
  tranches,
  GrantAirtable.layer,
  GrantPayments.layer,
  GrantSheets.layer,
  GrantPages.layer,
);

export const layer = Layer.mergeAll(
  GrantApplications.layer,
  GrantReview.layer,
).pipe(Layer.provideMerge(base));
