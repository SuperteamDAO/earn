import * as Layer from 'effect/Layer';

import * as EmailPreferences from '@/server/email-preferences';
import * as IpLocation from '@/server/ip-location';
import * as ManualEmails from '@/server/manual-emails';
import * as MemberPerks from '@/server/member-perks';
import * as SiteChapters from '@/server/site-chapters';
import * as Sitemaps from '@/server/sitemaps';

// The site area's services, merged. Each may depend on the shared services
// in src/server/runtime.ts (`shared`) and on this area's own, never on
// another area's.
export const layer = Layer.mergeAll(
  EmailPreferences.layer,
  IpLocation.layer,
  ManualEmails.layer,
  MemberPerks.layer,
  Sitemaps.layer,
).pipe(Layer.provideMerge(SiteChapters.layer));
