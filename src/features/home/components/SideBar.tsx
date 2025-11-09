import { usePrivy } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/router';
import posthog from 'posthog-js';

import MdArrowForward from '@/components/icons/MdArrowForward';
import { AnimateChangeInHeight } from '@/components/shared/AnimateChangeInHeight';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useUser } from '@/store/user';

import { recentEarnersQuery } from '@/features/listings/queries/recent-earners';
import { yourBookmarksQuery } from '@/features/listings/queries/your-bookmarks';

import { totalsQuery } from '../queries/totals';
import { HowItWorks } from './HowItWorks';
import { RecentActivity } from './RecentActivity';
import { RecentEarners } from './RecentEarners';
import { SponsorBanner } from './SponsorBanner';
import { TotalStats } from './TotalStats';
import { YourBookmarks } from './YourBookmarks';

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
  const { data: bookmarks } = useQuery(yourBookmarksQuery({ take: 5 }));

  return (
    <AnimateChangeInHeight duration={0.3}>
      <div className="flex w-96 flex-col gap-8 py-3 pl-6">
        {type === 'feed' && (
          <>
            <VibeCard />
            {/* <SidebarBannerCypherpunk /> */}
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
            <HowItWorks />
            <RecentEarners earners={recentEarners} />
          </>
        )}
        {type !== 'feed' && (
          <>
            <div className="flex flex-col gap-4">
              {router.asPath === '/' &&
                ready &&
                !isUserLoading &&
                (!user || (!user.isTalentFilled && !user.currentSponsorId)) && (
                  <SponsorBanner />
                )}
              <TotalStats
                isTotalLoading={isTotalsLoading}
                bountyCount={totals?.count}
                TVE={totals?.totalInUSD}
              />
            </div>

            <HowItWorks />
            {/* <SidebarBannerCypherpunk /> */}
            {router.asPath !== '/bookmarks' && !!bookmarks?.length && (
              <YourBookmarks>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-400">
                    BOOKMARKS
                  </span>
                  <Link
                    href="/bookmarks"
                    className="text-brand-purple flex items-center text-xs font-semibold"
                    onClick={() => {
                      posthog.capture('bookmarks_sidebar');
                    }}
                  >
                    View All
                    <MdArrowForward className="ml-1" />
                  </Link>
                </div>
              </YourBookmarks>
            )}
            <RecentEarners earners={recentEarners} />
            <RecentActivity />
          </>
        )}
      </div>
    </AnimateChangeInHeight>
  );
};
