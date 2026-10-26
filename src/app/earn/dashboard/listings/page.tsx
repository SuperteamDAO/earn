import * as Effect from 'effect/Effect';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { SponsorLayout, sponsorMetadata } from '@/layouts/Sponsor';
import { ListingsSkeleton } from '@/layouts/SponsorLayoutSkeleton';
import { getViewer } from '@/lib/session';
import { runtime } from '@/server/runtime';
import * as SponsorDashboard from '@/server/sponsor-dashboard';

import { DashboardListings } from '@/features/sponsor-dashboard/components/DashboardListings';

export const metadata = sponsorMetadata;

// Earn's tab names, as old links carry them, to the ones the page keeps.
const TABS: Record<string, string> = {
  bounties: 'bounty',
  grants: 'grant',
  hackathons: 'hackathon',
};

export default async function SponsorListings(
  props: PageProps<'/earn/dashboard/listings'>,
) {
  const searchParams = await props.searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    for (const item of [value ?? []].flat()) query.append(key, item);
  }
  const tab = query.get('tab');
  if (tab && TABS[tab]) {
    query.set('tab', TABS[tab]);
    redirect(`/earn/dashboard/listings/?${query.toString()}`);
  }
  const search = query.toString();
  return (
    <SponsorLayout
      here={`/earn/dashboard/listings/${search ? `?${search}` : ''}`}
    >
      <Suspense fallback={<ListingsSkeleton />}>
        <Listings />
      </Suspense>
    </SponsorLayout>
  );
}

async function Listings() {
  const viewer = await getViewer();
  const sponsorId = viewer?.currentSponsorId;
  if (!sponsorId) return null;
  const [listings, stats, hackathons] = await runtime.runPromise(
    SponsorDashboard.SponsorDashboard.use((dashboard) =>
      Effect.all(
        [
          dashboard.listings(sponsorId),
          dashboard.sponsorStats(sponsorId),
          dashboard.activeHackathons,
        ],
        { concurrency: 'unbounded' },
      ),
    ),
  );
  return (
    <DashboardListings
      listings={listings}
      stats={stats}
      hackathons={hackathons}
    />
  );
}
