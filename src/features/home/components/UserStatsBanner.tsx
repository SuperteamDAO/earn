import 'server-only';

import * as Effect from 'effect/Effect';

import { getViewer } from '@/lib/session';
import * as HomeStats from '@/server/home-stats';
import { runtime } from '@/server/runtime';

import { UserStatsBannerView } from './UserStatsBannerView';

// The homepage's welcome banner for a signed-in viewer, with their
// earnings once they've won.
export async function UserStatsBanner() {
  const viewer = await getViewer();
  const stats = viewer
    ? await runtime.runPromise(
        HomeStats.HomeStats.use((home) => home.userStats(viewer.id)).pipe(
          Effect.orElseSucceed(() => null),
        ),
      )
    : null;
  return (
    <UserStatsBannerView
      user={
        viewer && {
          id: viewer.id,
          photo: viewer.photo,
          isTalentFilled: viewer.isTalentFilled,
          firstName: viewer.firstName,
        }
      }
      stats={stats}
    />
  );
}
