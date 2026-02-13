import { usePrivy } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/router';
import posthog from 'posthog-js';
import { useCallback } from 'react';

import MdArrowForward from '@/components/icons/MdArrowForward';
import { AnimateChangeInHeight } from '@/components/shared/AnimateChangeInHeight';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { type User } from '@/interface/user';
import { useUser } from '@/store/user';

import { recentEarnersQuery } from '@/features/listings/queries/recent-earners';
import { yourBookmarksQuery } from '@/features/listings/queries/your-bookmarks';
import { type Listing } from '@/features/listings/types';
import { ProIntro } from '@/features/pro/components/ProIntro';
import { useProUpgradeFlow } from '@/features/pro/state/pro-upgrade-flow';

import { totalsQuery } from '../queries/totals';
import { userStatsQuery } from '../queries/user-stats';
import { HowItWorks } from './HowItWorks';
import { RecentActivity } from './RecentActivity';
import { RecentEarners } from './RecentEarners';
import { SeoFaq } from './SeoFaq';
import { SponsorBanner } from './SponsorBanner';
import { SponsorFeatures } from './SponsorFeatures';
import { SponsorResources } from './SponsorResources';
import { SponsorListing } from './SponsorStage/SponsorSidebarListing';
import { SponsorWelcomeVideo } from './SponsorStage/SponsorWelcomeVideo';
import { TotalStats } from './TotalStats';
import { YourBookmarks } from './YourBookmarks';

interface SideBarProps {
  type:
    | 'landing'
    | 'listing'
    | 'category'
    | 'category-all'
    | 'region'
    | 'feed'
    | 'region-all'
    | 'skill'
    | 'skill-all'
    | 'opportunity';
}

const VibeCard = dynamic(() =>
  import('@/features/home/components/VibeCard').then((mod) => mod.VibeCard),
);

const LiveListings = dynamic(() =>
  import('@/features/home/components/LiveListings').then(
    (mod) => mod.LiveListings,
  ),
);

const SectionHeader = ({
  title,
  href,
  onLinkClick,
}: {
  title: string;
  href: string;
  onLinkClick?: () => void;
}) => (
  <div className="flex items-center justify-between">
    <span className="text-sm font-medium text-gray-400">{title}</span>
    <Link
      href={href}
      className="text-brand-purple flex items-center text-xs font-semibold"
      onClick={onLinkClick}
    >
      View All
      <MdArrowForward className="ml-1" />
    </Link>
  </div>
);

interface FeedSidebarContentProps {
  recentEarners: User[] | undefined;
}

const FeedSidebarContent = ({ recentEarners }: FeedSidebarContentProps) => (
  <>
    <VibeCard />
    <LiveListings>
      <SectionHeader title="LIVE LISTINGS" href="/earn" />
    </LiveListings>
    <HowItWorks />
    <SeoFaq />
    <RecentEarners earners={recentEarners} />
  </>
);

const SponsorSidebarContent = () => (
  <div className="mt-2 flex flex-col gap-8">
    <SponsorWelcomeVideo />
    <SponsorListing />
    <SponsorResources />
    <SponsorFeatures />
  </div>
);

interface NonSponsorSidebarContentProps {
  totals: { count?: number; totalInUSD?: number } | undefined;
  isTotalsLoading: boolean;
  recentEarners: User[] | undefined;
  bookmarks: Listing[] | undefined;
  currentPath: string;
  showSponsorBanner: boolean;
  showProIntro: boolean;
  onBookmarksClick: () => void;
}

const NonSponsorSidebarContent = ({
  totals,
  isTotalsLoading,
  recentEarners,
  bookmarks,
  currentPath,
  showSponsorBanner,
  showProIntro,
  onBookmarksClick,
}: NonSponsorSidebarContentProps) => (
  <>
    <div className="flex flex-col gap-4">
      {showSponsorBanner && <SponsorBanner />}
      {showProIntro && <ProIntro origin="sidebar" />}
      <TotalStats
        isTotalLoading={isTotalsLoading}
        bountyCount={totals?.count}
        TVE={totals?.totalInUSD}
      />
    </div>
    <HowItWorks />
    <SeoFaq />
    {currentPath !== '/earn/bookmarks' && !!bookmarks?.length && (
      <YourBookmarks>
        <SectionHeader
          title="BOOKMARKS"
          href="/earn/bookmarks"
          onLinkClick={onBookmarksClick}
        />
      </YourBookmarks>
    )}
    <RecentEarners earners={recentEarners} />
    <RecentActivity />
  </>
);

export const HomeSideBar = ({ type }: SideBarProps) => {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const isLg = useBreakpoint('lg');
  const { ready } = usePrivy();
  const { flow } = useProUpgradeFlow();

  const { data: totals, isLoading: isTotalsLoading } = useQuery({
    ...totalsQuery,
    enabled: isLg,
  });
  const { data: recentEarners } = useQuery({
    ...recentEarnersQuery,
    enabled: isLg,
  });
  const { data: bookmarks } = useQuery(yourBookmarksQuery({ take: 5 }));

  const { data: stats, isLoading: isStatsLoading } = useQuery(userStatsQuery);

  const isSponsor = !!(ready && !isUserLoading && user?.currentSponsorId);
  const isFeed = type === 'feed';
  const showSponsorBanner =
    router.asPath === '/earn' &&
    ready &&
    !isUserLoading &&
    (!user || (!user.isTalentFilled && !user.currentSponsorId));

  const showProIntro = !!(
    !user?.isPro &&
    user?.isTalentFilled &&
    !isStatsLoading &&
    ((stats?.totalWinnings && stats.totalWinnings >= 1000) ||
      user?.superteamLevel?.includes('Superteam'))
  );
  const isSidebarFlowActive =
    flow.source === 'sidebar' && flow.status !== 'idle';
  const shouldRenderProIntro = (showProIntro ?? false) || isSidebarFlowActive;

  const handleBookmarksClick = useCallback(() => {
    posthog.capture('bookmarks_sidebar');
  }, []);

  const renderContent = () => {
    if (isFeed) {
      return <FeedSidebarContent recentEarners={recentEarners} />;
    }

    if (isSponsor) {
      return (
        <div className="flex flex-col gap-4">
          <SponsorSidebarContent />
        </div>
      );
    }

    return (
      <NonSponsorSidebarContent
        totals={totals}
        isTotalsLoading={isTotalsLoading}
        recentEarners={recentEarners}
        bookmarks={bookmarks}
        currentPath={router.asPath}
        showSponsorBanner={showSponsorBanner}
        showProIntro={shouldRenderProIntro}
        onBookmarksClick={handleBookmarksClick}
      />
    );
  };

  return (
    <AnimateChangeInHeight duration={0.3}>
      <div className="flex w-96 flex-col gap-8 py-3 pl-6">
        {renderContent()}
      </div>
    </AnimateChangeInHeight>
  );
};
