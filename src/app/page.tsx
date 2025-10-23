'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

import { useBreakpoint } from '@/hooks/use-breakpoint';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { cn } from '@/utils/cn';

import { BannerCarousel } from '@/features/home/components/Banner';
import { UserStatsBanner } from '@/features/home/components/UserStatsBanner';
import { userCountQuery } from '@/features/home/queries/user-count';
import { ListingCardSkeleton } from '@/features/listings/components/ListingCard';
import { ListingsSection } from '@/features/listings/components/ListingsSection';

const GrantsSection = dynamic(() =>
  import('@/features/grants/components/GrantsSection').then(
    (mod) => mod.GrantsSection,
  ),
);

const HomeSideBar = dynamic(() =>
  import('@/features/home/components/SideBar').then((mod) => mod.HomeSideBar),
);

const InstallPWAModal = dynamic(
  () =>
    import('@/components/modals/InstallPWAModal').then(
      (mod) => mod.InstallPWAModal,
    ),
  { ssr: false },
);

const HomepagePop = dynamic(
  () =>
    import('@/features/conversion-popups/components/HomepagePop').then(
      (mod) => mod.HomepagePop,
    ),
  { ssr: false },
);

const TalentAnnouncements = dynamic(
  () =>
    import('@/features/announcements/components/TalentAnnouncements').then(
      (mod) => mod.TalentAnnouncements,
    ),
  { ssr: false },
);

function ListingsSectionFallback() {
  return (
    <div className="mt-5 space-y-1">
      {Array.from({ length: 5 }).map((_, index) => (
        <ListingCardSkeleton key={index} />
      ))}
    </div>
  );
}

export default function HomePage() {
  const { authenticated } = usePrivy();
  const { data: totalUsers } = useQuery(userCountQuery);
  const isLg = useBreakpoint('lg');

  return (
    <Default
      className="bg-white"
      meta={
        <Meta
          title="Superteam Earn | Work to Earn in Crypto"
          description="Explore the latest bounties on Superteam Earn, offering opportunities in the crypto space across Design, Development, and Content."
          canonical="https://earn.superteam.fun"
        />
      }
    >
      <div className={cn('mx-auto w-full px-2 lg:px-6')}>
        <div className="mx-auto w-full max-w-7xl p-0">
          <div className="flex items-start justify-between">
            <div className="w-full lg:border-r lg:border-slate-100">
              <div className="w-full lg:pr-6">
                <div className="pt-3">
                  {authenticated ? (
                    <UserStatsBanner />
                  ) : (
                    <BannerCarousel totalUsers={totalUsers?.totalUsers} />
                  )}
                </div>
                <div className="w-full">
                  <Suspense fallback={<ListingsSectionFallback />}>
                    <ListingsSection type="home" />
                  </Suspense>
                  {/* <HackathonSection type="home" /> */}
                  <GrantsSection type="home" />
                </div>
              </div>
            </div>
            {isLg && (
              <div className="flex">
                <HomeSideBar type="landing" />
              </div>
            )}
          </div>
        </div>
      </div>
      <InstallPWAModal />
      <HomepagePop />
      <TalentAnnouncements />
    </Default>
  );
}
