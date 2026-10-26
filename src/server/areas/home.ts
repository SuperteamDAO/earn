import * as Layer from 'effect/Layer';

import * as HomeChapters from '@/server/home-chapters';

// The home area's services, merged. Each may depend on the shared services
// in src/server/runtime.ts (`shared`) and on this area's own, never on
// another area's.
export const layer = Layer.mergeAll(HomeChapters.layer);
