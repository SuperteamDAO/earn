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
import { SponsorFeatures } from './SponsorFeatures';
import { SponsorResources } from './SponsorResources';
import { SponsorListing } from './SponsorStage/SponsorSidebarListing';
import { SponsorWelcomeVideo } from './SponsorStage/SponsorWelcomeVideo';
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

  const isSponsor = !!(ready && !isUserLoading && user?.currentSponsorId);
  const isFeed = type === 'feed';
  const showSponsorBanner =
    router.asPath === '/' &&
    ready &&
    !isUserLoading &&
    (!user || (!user.isTalentFilled && !user.currentSponsorId));

  return (
    <AnimateChangeInHeight duration={0.3}>
      <div className="flex w-96 flex-col gap-8 py-3 pl-6">
        {isFeed ? (
          <>
            <VibeCard />
            <LiveListings>
              <SectionHeader title="LIVE LISTINGS" href="/" />
            </LiveListings>
            <HowItWorks />
            <RecentEarners earners={recentEarners} />
          </>
        ) : (
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
              {showSponsorBanner && <SponsorBanner />}
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
                {router.asPath !== '/bookmarks' && !!bookmarks?.length && (
                  <YourBookmarks>
                    <SectionHeader
                      title="BOOKMARKS"
                      href="/bookmarks"
                      onLinkClick={() => posthog.capture('bookmarks_sidebar')}
                    />
                  </YourBookmarks>
                )}
                <RecentEarners earners={recentEarners} />
                <RecentActivity />
              </>
            )}
          </>
        )}
      </div>
    </AnimateChangeInHeight>
  );
};
