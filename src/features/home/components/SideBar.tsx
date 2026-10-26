import { usePrivy } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/router';
import posthog from 'posthog-js';
import { useCallback } from 'react';

import MdArrowForward from '@/components/icons/MdArrowForward';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { type User } from '@/interface/user';
import { type UserRoleHint, useUser } from '@/store/user';

import { recentEarnersQuery } from '@/features/listings/queries/recent-earners';
import { yourBookmarksQuery } from '@/features/listings/queries/your-bookmarks';
import { type Listing } from '@/features/listings/types';

import { totalsQuery } from '../queries/totals';
import { HowItWorks } from './HowItWorks';
import { RecentActivity } from './RecentActivity';
import { RecentEarners } from './RecentEarners';
import { SidebarBanner } from './SidebarBanner';
import { HomeSideBarSkeleton } from './SideBarSkeleton';
import { SponsorBanner } from './SponsorBanner';
import { SponsorFeatures } from './SponsorFeatures';
import { SponsorResources } from './SponsorResources';
import { SponsorListing } from './SponsorStage/SponsorSidebarListing';
import { SponsorWelcomeVideo } from './SponsorStage/SponsorWelcomeVideo';
import { TotalStats } from './TotalStats';
import { YourBookmarks } from './YourBookmarks';

interface SideBarProps {
  type: 'landing' | 'listing' | 'category' | 'region' | 'feed';
  /** SSR-provided role hint (homepage) for picking the loading skeleton. */
  roleHint?: UserRoleHint | null;
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
    <SidebarBanner />
    <LiveListings>
      <SectionHeader title="LIVE LISTINGS" href="/earn" />
    </LiveListings>
    <HowItWorks />
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
  onBookmarksClick: () => void;
}

const NonSponsorSidebarContent = ({
  totals,
  isTotalsLoading,
  recentEarners,
  bookmarks,
  currentPath,
  showSponsorBanner,
  onBookmarksClick,
}: NonSponsorSidebarContentProps) => (
  <>
    <div className="flex flex-col gap-4">
      {showSponsorBanner && <SponsorBanner />}
      <TotalStats
        isTotalLoading={isTotalsLoading}
        bountyCount={totals?.count}
        TVE={totals?.totalInUSD}
      />
    </div>
    <SidebarBanner />
    <HowItWorks />
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

export const HomeSideBar = ({ type, roleHint }: SideBarProps) => {
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

  const isSponsor = !!(ready && !isUserLoading && user?.currentSponsorId);
  // Avoid flashing talent content for a sponsor while the user resolves.
  const isResolvingSponsor =
    (!ready || isUserLoading) && roleHint === 'sponsor';
  const isFeed = type === 'feed';
  const showSponsorBanner =
    router.asPath === '/earn' &&
    ready &&
    !isUserLoading &&
    (!user || (!user.isTalentFilled && !user.currentSponsorId));

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
        onBookmarksClick={handleBookmarksClick}
      />
    );
  };

  if (isResolvingSponsor && !isFeed) {
    return <HomeSideBarSkeleton />;
  }

  return (
    <div className="flex w-96 flex-col gap-8 py-3 pl-6">{renderContent()}</div>
  );
};
