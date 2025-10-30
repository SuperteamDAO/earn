import { usePrivy } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/router';

import MdArrowForward from '@/components/icons/MdArrowForward';
import { AnimateChangeInHeight } from '@/components/shared/AnimateChangeInHeight';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useUser } from '@/store/user';

import { recentEarnersQuery } from '@/features/listings/queries/recent-earners';

import { totalsQuery } from '../queries/totals';
import { HowItWorks } from './HowItWorks';
import { RecentActivity } from './RecentActivity';
import { RecentEarners } from './RecentEarners';
import { SidebarBannerCypherpunk } from './SidebarBanner';
import { SponsorBanner } from './SponsorBanner';
import { SponsorFeatures } from './SponsorFeatures';
import { SponsorResources } from './SponsorResources';
import { SponsorListing } from './SponsorStage/SponsorSidebarListing';
import { SponsorWelcomeVideo } from './SponsorStage/SponsorWelcomeVideo';
import { TotalStats } from './TotalStats';

interface SideBarProps {
  type: 'landing' | 'listing' | 'category' | 'region' | 'feed' | 'region-all';
}

const VibeCard = dynamic(() =>
  import('@/features/home/components/VibeCard').then((mod) => mod.VibeCard),
);

const LiveListings = dynamic(() =>
  import('@/features/home/components/LiveListings').then(
    (mod) => mod.LiveListings,
  ),
);

export const HomeSideBar = ({ type }: SideBarProps) => {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const isLg = useBreakpoint('lg');

  const { ready } = usePrivy();

  const { data: totals, isLoading: isTotalsLoading } = useQuery({
    ...totalsQuery,
    enabled: isLg,
  });
  const { data: recentEarners } = useQuery({
    ...recentEarnersQuery,
    enabled: isLg,
  });

  const isSponsor = !!(ready && !isUserLoading && user?.currentSponsorId);

  return (
    <AnimateChangeInHeight duration={0.3}>
      <div className="flex w-96 flex-col gap-8 py-3 pl-6">
        {type === 'feed' && (
          <>
            <VibeCard />
            <SidebarBannerCypherpunk />
            <LiveListings>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-400">
                  LIVE LISTINGS
                </span>
                <Link
                  href="/"
                  className="text-brand-purple flex items-center text-xs font-semibold"
                >
                  View All
                  <MdArrowForward className="ml-1" />
                </Link>
              </div>
            </LiveListings>
          </>
        )}
        {type !== 'feed' ? (
          <>
            <div className="flex flex-col gap-4">
              {isSponsor && (
                <div className="mt-2 flex flex-col gap-8">
                  <SponsorWelcomeVideo />
                  <SponsorListing />
                  <SponsorResources />
                  <SponsorFeatures />
                </div>
              )}
              {router.asPath === '/' &&
                ready &&
                !isUserLoading &&
                (!user || (!user.isTalentFilled && !user.currentSponsorId)) && (
                  <SponsorBanner />
                )}
              {!isSponsor && (
                <TotalStats
                  isTotalLoading={isTotalsLoading}
                  bountyCount={totals?.count}
                  TVE={totals?.totalInUSD}
                />
              )}
            </div>

            {!isSponsor && (
              <>
                <HowItWorks />
                <SidebarBannerCypherpunk />
                <RecentEarners earners={recentEarners} />
                <RecentActivity />
              </>
            )}
          </>
        ) : (
          <>
            <HowItWorks />
            <RecentEarners earners={recentEarners} />
          </>
        )}
      </div>
    </AnimateChangeInHeight>
  );
};
