import * as Effect from 'effect/Effect';
import { Suspense } from 'react';

import { SponsorLayout, sponsorMetadata } from '@/layouts/Sponsor';
import { TeamSettingsSkeleton } from '@/layouts/SponsorLayoutSkeleton';
import { getViewer } from '@/lib/session';
import { runtime } from '@/server/runtime';
import * as SponsorDashboard from '@/server/sponsor-dashboard';
import * as TeamMembers from '@/server/team-members';

import { TeamSettings } from '@/features/sponsor-dashboard/components/Members/TeamSettings';

export const metadata = sponsorMetadata;

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function TeamSettingsPage(
  props: PageProps<'/earn/dashboard/team-settings'>,
) {
  const searchParams = await props.searchParams;
  const search = (first(searchParams.search) ?? '').slice(0, 100);
  const rawSkip = Number(first(searchParams.skip) ?? 0);
  const skip =
    Number.isInteger(rawSkip) && rawSkip >= 0 ? Math.min(rawSkip, 1000) : 0;
  const query = new URLSearchParams();
  if (search) query.set('search', search);
  if (skip) query.set('skip', String(skip));
  const here = `/earn/dashboard/team-settings/${query.size ? `?${query.toString()}` : ''}`;
  return (
    <SponsorLayout here={here}>
      <Suspense fallback={<TeamSettingsSkeleton />}>
        <Members search={search} skip={skip} />
      </Suspense>
    </SponsorLayout>
  );
}

async function Members({ search, skip }: { search: string; skip: number }) {
  const viewer = await getViewer();
  const sponsorId = viewer?.currentSponsorId;
  if (!sponsorId) return null;
  const [members, stats] = await runtime.runPromise(
    Effect.all(
      [
        TeamMembers.TeamMembers.use((team) =>
          team.list(sponsorId, { search, skip }),
        ),
        SponsorDashboard.SponsorDashboard.use((dashboard) =>
          dashboard.sponsorStats(sponsorId),
        ),
      ],
      { concurrency: 'unbounded' },
    ),
  );
  return (
    <TeamSettings
      stats={stats}
      members={members.data}
      totalMembers={members.total}
      skip={skip}
      length={TeamMembers.MEMBERS_PER_PAGE}
    />
  );
}
