import * as Layer from 'effect/Layer';

import * as LocalProfiles from '@/server/local-profiles';
import * as SponsorDashboard from '@/server/sponsor-dashboard';
import * as SponsorMemberDetails from '@/server/sponsor-member-details';
import * as SponsorSwitch from '@/server/sponsor-switch';
import * as TeamInviteMail from '@/server/team-invite-mail';
import * as TeamInvites from '@/server/team-invites';
import * as TeamMembers from '@/server/team-members';

// The dashboard area's services, merged. Each may depend on the shared services
// in src/server/runtime.ts (`shared`) and on this area's own, never on
// another area's.
export const layer = Layer.mergeAll(
  SponsorDashboard.layer,
  SponsorSwitch.layer,
  SponsorMemberDetails.layer,
  TeamMembers.layer,
  TeamInvites.layer.pipe(Layer.provide(TeamInviteMail.layer)),
  LocalProfiles.layer,
);
