import { useRouter } from 'next/router';

import { Skeleton } from '@/components/ui/skeleton';

import { BannerSkeleton } from '@/features/sponsor-dashboard/components/BannerSkeleton';
import { ListingTableSkeleton } from '@/features/sponsor-dashboard/components/ListingTableSkeleton';
import { UserTableSkeleton } from '@/features/sponsor-dashboard/components/LocalProfiles/UserTableSkeleton';
import { MembersTableSkeleton } from '@/features/sponsor-dashboard/components/Members/MembersTableSkeleton';
import { SubmissionsPageSkeleton } from '@/features/sponsor-dashboard/components/Submissions/SubmissionsPageSkeleton';

const ListingsHeader = () => (
  <div className="mb-4 flex w-full flex-col justify-between gap-2 lg:flex-row lg:items-center">
    <div className="flex items-center whitespace-nowrap">
      <p className="text-lg font-semibold text-slate-800">My Listings</p>
      <div className="mx-3 h-6 w-px bg-slate-300" />
      <p className="text-slate-500">The one place to manage your listings</p>
    </div>
    <div className="flex w-full items-center gap-2 lg:justify-end">
      <Skeleton className="h-9 w-40 rounded-lg" />
      <Skeleton className="h-9 w-64 rounded-lg lg:w-35 xl:w-64" />
    </div>
  </div>
);

const HackathonHeader = () => (
  <div className="mb-4 flex w-full justify-between">
    <div className="flex items-center gap-3">
      <p className="text-lg font-semibold text-slate-800">All Tracks</p>
      <div className="mx-1 h-[60%] border-r border-slate-200" />
      <p className="text-slate-500">
        Review hackathon tracks and submissions here
      </p>
    </div>
  </div>
);

const TeamSettingsHeader = () => (
  <div className="mb-4 flex flex-col justify-between gap-3 xl:flex-row xl:items-center">
    <div className="flex min-w-0 shrink-0 items-start gap-3 lg:items-center">
      <p className="font-semibold whitespace-nowrap text-slate-800 lg:text-lg">
        Team Members
      </p>
      <p className="text-slate-500">
        Manage who gets access to your sponsor profile
      </p>
    </div>
  </div>
);

function getContentSkeleton(path: string) {
  const cleanPath = path.split('?')[0] ?? '';

  if (/\/listings\/[^/]+\/submissions/.test(cleanPath)) {
    return <SubmissionsPageSkeleton />;
  }

  if (/\/hackathon\/[^/]+\/submissions/.test(cleanPath)) {
    return <SubmissionsPageSkeleton />;
  }

  if (/\/grants\/[^/]+\/applications/.test(cleanPath)) {
    return <SubmissionsPageSkeleton />;
  }

  if (cleanPath.includes('/team-settings')) {
    return (
      <>
        <BannerSkeleton />
        <TeamSettingsHeader />
        <MembersTableSkeleton />
      </>
    );
  }

  if (cleanPath.includes('/local-profiles')) {
    return <UserTableSkeleton />;
  }

  if (cleanPath.endsWith('/hackathon') || cleanPath.endsWith('/hackathon/')) {
    return (
      <>
        <BannerSkeleton />
        <HackathonHeader />
        <ListingTableSkeleton rows={10} />
      </>
    );
  }

  if (cleanPath.endsWith('/listings') || cleanPath.endsWith('/listings/')) {
    return (
      <>
        <BannerSkeleton />
        <ListingsHeader />
        <ListingTableSkeleton rows={10} />
      </>
    );
  }

  return null;
}

export const SponsorContentSkeleton = () => {
  const router = useRouter();
  return getContentSkeleton(router.asPath);
};
