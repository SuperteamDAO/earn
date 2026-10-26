import * as Layer from 'effect/Layer';

import * as ListingAi from '@/server/listing-ai';
import * as ListingBuilder from '@/server/listing-builder';
import * as ListingTemplates from '@/server/listing-templates';
import * as Tokens from '@/server/tokens';

// The builder area's services, merged. Each may depend on the shared services
// in src/server/runtime.ts (`shared`) and on this area's own, never on
// another area's.
export const layer = Layer.mergeAll(
  ListingBuilder.layer,
  ListingAi.layer,
  ListingTemplates.layer,
).pipe(Layer.provideMerge(Tokens.layer));
