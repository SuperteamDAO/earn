import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { usePostHog } from 'posthog-js/react';
import { useEffect } from 'react';

import { EmptySection } from '@/components/shared/EmptySection';
import { Button } from '@/components/ui/button';
import { useBreakpoint } from '@/hooks/use-breakpoint';

import { CATEGORY_NAV_ITEMS } from '@/features/navbar/constants';

import { useListings } from '../hooks/useListings';
import { useListingState } from '../hooks/useListingState';
import type { ListingTabsProps } from '../types';
import { CategoryPill } from './CategoryPill';
import { ListingCard, ListingCardSkeleton } from './ListingCard';
import { ListingFilters } from './ListingFilters';
import { ListingTabTrigger } from './ListingTabTrigger';

const TABS = [
  {
    id: 'all_open',
    title: 'All Open',
    posthog: 'all_open_listings',
  },
  {
    id: 'bounties',
    title: 'Bounties',
    posthog: 'bounties_listings',
  },
  {
    id: 'projects',
    title: 'Projects',
    posthog: 'projects_listings',
  },
] as const;

export const ListingTabs = ({
  type,
  defaultTab = 'all_open',
  defaultPill = 'All',
}: ListingTabsProps) => {
  const posthog = usePostHog();
  const isMd = useBreakpoint('md');

  const {
    activeTab,
    activePill,
    activeStatus,
    activeSortBy,
    activeOrder,
    handleTabChange,
    handlePillChange,
    handleStatusChange,
    handleSortChange,
  } = useListingState({
    defaultTab,
    defaultPill,
  });

  const {
    data: listings,
    isLoading,
    error,
  } = useListings({
    context: type,
    tab: activeTab,
    pill: activePill,
    status: activeStatus,
    sortBy: activeSortBy,
    order: activeOrder,
  });

  useEffect(() => {
    const initialTab = TABS.find((t) => t.id === activeTab);
    if (initialTab) {
      posthog.capture(initialTab.posthog);
    }
  }, [activeTab, posthog]);

  const renderContent = () => {
    if (isLoading) {
      return Array.from({ length: 5 }).map((_, index) => (
        <ListingCardSkeleton key={index} />
      ));
    }

    if (error) {
      return <EmptySection title="Error loading listings" />;
    }

    if (!listings?.length) {
      return <EmptySection title="No listings found" />;
    }

    return (
      <>
        {listings.map((listing) => (
          <ListingCard key={listing.id} bounty={listing} />
        ))}
        {type === 'home' && (
          <Link className="ph-no-capture" href="/all">
            <Button
              className="my-8 w-full border-slate-300 py-5 text-slate-400"
              onClick={() => posthog.capture('viewall bottom_listings')}
              size="sm"
              variant="outline"
            >
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        )}
      </>
    );
  };

  return (
    <div className="mt-5 mb-10">
      <div className="mb-4 flex w-full items-center justify-between">
        <div className="flex">
          {TABS.map((tab) => (
            <ListingTabTrigger
              key={tab.id}
              isActive={activeTab === tab.id}
              onClick={() => handleTabChange(tab.id, tab.posthog)}
            >
              <span className="text-[13px] font-medium md:text-[14px]">
                {tab.title}
              </span>
            </ListingTabTrigger>
          ))}
        </div>

        <ListingFilters
          activeStatus={activeStatus}
          activeSortBy={activeSortBy}
          activeOrder={activeOrder}
          onStatusChange={handleStatusChange}
          onSortChange={handleSortChange}
        />
      </div>

      <div className="-mt-1.5 mb-4 h-0.5 w-full bg-slate-200" />

      <div className="mb-2 flex gap-1 overflow-x-auto pb-1">
        <CategoryPill
          key="all"
          phEvent="all_navpill"
          isActive={activePill === 'All'}
          onClick={() => handlePillChange('All', 'all_navpill')}
        >
          All
        </CategoryPill>
        <CategoryPill
          key="foryou"
          phEvent="foryou_navpill"
          isActive={activePill === 'For You'}
          onClick={() => handlePillChange('For You', 'foryou_navpill')}
        >
          For You
        </CategoryPill>
        {CATEGORY_NAV_ITEMS?.map((navItem) => (
          <CategoryPill
            key={navItem.label}
            phEvent={navItem.pillPH}
            isActive={activePill === navItem.label}
            onClick={() => handlePillChange(navItem.label, navItem.pillPH)}
          >
            {isMd ? navItem.label : navItem.mobileLabel || navItem.label}
          </CategoryPill>
        ))}
      </div>

      {renderContent()}
    </div>
  );
};
