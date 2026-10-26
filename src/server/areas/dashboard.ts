import * as Layer from 'effect/Layer';

import * as SponsorDashboard from '@/server/sponsor-dashboard';
import * as SponsorMemberDetails from '@/server/sponsor-member-details';
import * as SponsorSwitch from '@/server/sponsor-switch';

// The dashboard area's services, merged. Each may depend on the shared services
// in src/server/runtime.ts (`shared`) and on this area's own, never on
// another area's.
export const layer = Layer.mergeAll(
  SponsorDashboard.layer,
  SponsorSwitch.layer,
  SponsorMemberDetails.layer,
);
