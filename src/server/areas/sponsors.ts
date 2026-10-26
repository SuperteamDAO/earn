import * as Layer from 'effect/Layer';

import * as SponsorAccounts from '@/server/sponsor-accounts';
import * as SponsorIntegrations from '@/server/sponsor-integrations';
import * as SponsorLanding from '@/server/sponsor-landing';
import * as SponsorVerification from '@/server/sponsor-verification';

// The sponsors area's services, merged. Each may depend on the shared services
// in src/server/runtime.ts (`shared`) and on this area's own, never on
// another area's.
export const layer = Layer.mergeAll(
  SponsorAccounts.layer.pipe(Layer.provide(SponsorIntegrations.layer)),
  SponsorVerification.layer,
  SponsorLanding.layer,
);
