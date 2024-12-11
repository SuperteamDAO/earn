import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { MdArrowForward } from 'react-icons/md';

import { recentEarnersQuery } from '@/features/listings';
import { useUser } from '@/store/user';

import { totalsQuery } from '../queries';
import { HowItWorks } from './HowItWorks';
import { RecentActivity } from './RecentActivity';
import { RecentEarners } from './RecentEarners';
import { SponsorBanner } from './SponsorBanner';
import { TotalStats } from './TotalStats';

interface SideBarProps {
  type: 'landing' | 'listing' | 'category' | 'region' | 'niche' | 'feed';
}

const VibeCard = dynamic(() =>
  import('@/features/home').then((mod) => mod.VibeCard),
);

const LiveListings = dynamic(() =>
  import('@/features/home').then((mod) => mod.LiveListings),
);

export const HomeSideBar = ({ type }: SideBarProps) => {
  const router = useRouter();
  const { user } = useUser();

  const { data: totals, isLoading: isTotalsLoading } = useQuery(totalsQuery);
  const { data: recentEarners } = useQuery(recentEarnersQuery);

  return (
    <div className="flex w-96 flex-col gap-10 py-6 pl-6">
      {type === 'feed' && (
        <>
          <VibeCard />
          <LiveListings>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-400">
                LIVE LISTINGS
              </span>
              <Link
                href="/"
                className="flex items-center text-xs font-semibold text-brand-purple"
              >
                View All
                <MdArrowForward className="ml-1" />
              </Link>
            </div>
          </LiveListings>
        </>
      )}
      {router.asPath === '/' &&
        (!user || (!user.isTalentFilled && !user.currentSponsorId)) && (
          <SponsorBanner />
        )}
      {type !== 'feed' ? (
        <>
          <TotalStats
            isTotalLoading={isTotalsLoading}
            bountyCount={totals?.count}
            TVE={totals?.totalInUSD}
          />
          <HowItWorks />
          <RecentEarners earners={recentEarners} />
          <RecentActivity />
        </>
      ) : (
        <>
          <HowItWorks />
          <RecentEarners earners={recentEarners} />
        </>
      )}
    </div>
  );
};
