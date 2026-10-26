import * as Effect from 'effect/Effect';
import { Suspense } from 'react';

import { SponsorLayout, sponsorMetadata } from '@/layouts/Sponsor';
import { HackathonSkeleton } from '@/layouts/SponsorLayoutSkeleton';
import { getViewer } from '@/lib/session';
import { runtime } from '@/server/runtime';
import * as SponsorDashboard from '@/server/sponsor-dashboard';

import { HackathonTracksView } from '@/features/sponsor-dashboard/components/HackathonTracksView';

export const metadata = sponsorMetadata;

const NO_TRACKS: SponsorDashboard.HackathonTracks = {
  total: 0,
  startDate: undefined,
  listings: [],
};

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function HackathonPage(
  props: PageProps<'/earn/dashboard/hackathon'>,
) {
  const searchParams = await props.searchParams;
  const search = (first(searchParams.search) ?? '').slice(0, 100);
  const rawSkip = Number(first(searchParams.skip) ?? 0);
  const skip =
    Number.isInteger(rawSkip) && rawSkip >= 0 ? Math.min(rawSkip, 1000) : 0;
  const query = new URLSearchParams();
  if (search) query.set('search', search);
  if (skip) query.set('skip', String(skip));
  const here = `/earn/dashboard/hackathon/${query.size ? `?${query.toString()}` : ''}`;
  return (
    <SponsorLayout here={here}>
      <Suspense fallback={<HackathonSkeleton />}>
        <Tracks search={search} skip={skip} />
      </Suspense>
    </SponsorLayout>
  );
}

async function Tracks({ search, skip }: { search: string; skip: number }) {
  const viewer = await getViewer();
  if (!viewer) return null;
  const hackathonId = viewer.hackathonId;
  const load = Effect.gen(function* () {
    const dashboard = yield* SponsorDashboard.SponsorDashboard;
    // No hackathon chosen: no tracks, as Earn's page showed.
    const tracks = dashboard
      .hackathonTracks(hackathonId, { search, skip })
      .pipe(Effect.catchTags({ NoHackathon: () => Effect.succeed(NO_TRACKS) }));
    return yield* Effect.all(
      [
        tracks,
        dashboard.hackathonStats(hackathonId),
        dashboard.activeHackathons,
      ],
      { concurrency: 'unbounded' },
    );
  });
  const [tracks, stats, hackathons] = await runtime.runPromise(load);
  return (
    <HackathonTracksView
      tracks={tracks.listings}
      total={tracks.total}
      startDate={tracks.startDate}
      stats={stats}
      hackathons={hackathons}
      skip={skip}
      length={SponsorDashboard.TRACKS_PER_PAGE}
    />
  );
}
