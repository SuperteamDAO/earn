import { Skeleton } from '@/components/ui/skeleton';

import { BannerSkeleton } from '@/features/sponsor-dashboard/components/BannerSkeleton';
import { ListingTableSkeleton } from '@/features/sponsor-dashboard/components/ListingTableSkeleton';
import { UserTableSkeleton } from '@/features/sponsor-dashboard/components/LocalProfiles/UserTableSkeleton';
import { MembersTableSkeleton } from '@/features/sponsor-dashboard/components/Members/MembersTableSkeleton';

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

// What a dashboard page shows inside the frame while its data loads, as
// Earn's SponsorLayout drew it per page.
export const ListingsSkeleton = () => (
  <>
    <BannerSkeleton />
    <ListingsHeader />
    <ListingTableSkeleton rows={10} />
  </>
);

export const HackathonSkeleton = () => (
  <>
    <BannerSkeleton />
    <HackathonHeader />
    <ListingTableSkeleton rows={10} />
  </>
);

export const TeamSettingsSkeleton = () => (
  <>
    <BannerSkeleton />
    <TeamSettingsHeader />
    <MembersTableSkeleton />
  </>
);

export const LocalProfilesSkeleton = () => <UserTableSkeleton />;
