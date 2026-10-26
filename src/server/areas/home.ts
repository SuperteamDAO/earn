import * as Layer from 'effect/Layer';

import * as GrantLists from '@/server/grant-lists';
import * as Hackathons from '@/server/hackathons';
import * as HomeChapters from '@/server/home-chapters';
import * as HomeStats from '@/server/home-stats';
import * as ListingLists from '@/server/listing-lists';
import * as ListingSearch from '@/server/listing-search';
import * as LiveLists from '@/server/live-lists';
import * as SponsorPages from '@/server/sponsor-pages';
import * as SponsorStages from '@/server/sponsor-stage';

// The home area's services, merged. Each may depend on the shared services
// in src/server/runtime.ts (`shared`) and on this area's own, never on
// another area's. HomeChapters is provided once, to all of them.
export const layer = Layer.mergeAll(
  Hackathons.layer,
  ListingLists.layer,
  GrantLists.layer,
  ListingSearch.layer,
  HomeStats.layer,
  SponsorStages.layer,
  LiveLists.layer,
  SponsorPages.layer,
).pipe(Layer.provideMerge(HomeChapters.layer));
