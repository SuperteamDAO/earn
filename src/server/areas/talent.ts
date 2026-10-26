import * as Layer from 'effect/Layer';

import * as ImageStore from '@/server/image-store';
import * as ImageUploads from '@/server/image-uploads';
import * as OgImages from '@/server/og-images';
import * as PrivyApi from '@/server/privy-api';
import * as ProfileWrites from '@/server/profile-writes';
import * as ProofOfWork from '@/server/proof-of-work';
import * as TalentDirectory from '@/server/talent-directory';
import * as TalentFeed from '@/server/talent-feed';
import * as TalentProfile from '@/server/talent-profile';
import * as TweetStats from '@/server/tweet-stats';
import * as XAccounts from '@/server/x-accounts';

// What the talent area's services build on.
const base = Layer.mergeAll(ImageStore.layer, PrivyApi.layer);

// The talent area's services, merged. Each may depend on the shared services
// in src/server/runtime.ts (`shared`) and on this area's own, never on
// another area's.
export const layer = Layer.mergeAll(
  ProfileWrites.layer,
  ProofOfWork.layer,
  TalentDirectory.layer,
  TalentProfile.layer,
  TalentFeed.layer,
  ImageUploads.layer,
  OgImages.layer,
  TweetStats.layer,
  XAccounts.layer,
).pipe(Layer.provideMerge(base));
