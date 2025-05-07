import { usePrivy } from '@privy-io/react-auth';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { usePostHog } from 'posthog-js/react';
import { useEffect } from 'react';

import { EmptySection } from '@/components/shared/EmptySection';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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
  potentialSession,
  region,
  sponsor,
}: ListingTabsProps) => {
  const posthog = usePostHog();
  const isMd = useBreakpoint('md');

  const { authenticated } = usePrivy();

  const {
    activeTab,
    activeCategory,
    activeStatus,
    activeSortBy,
    activeOrder,
    handleTabChange,
    handleCategoryChange,
    handleStatusChange,
    handleSortChange,
  } = useListingState({
    defaultCategory:
      (potentialSession || authenticated) && type === 'home'
        ? 'For You'
        : 'All',
  });

  const {
    data: listings,
    isLoading,
    error,
  } = useListings({
    context: type,
    tab: activeTab,
    category: activeCategory,
    status: activeStatus,
    sortBy: activeSortBy,
    order: activeOrder,
    region,
    sponsor,
  });

  useEffect(() => {
    const initialTab = TABS.find((t) => t.id === activeTab);
    if (initialTab) {
      posthog.capture(initialTab.posthog);
    }
  }, [activeTab, posthog]);

  const viewAllLink = () => {
    if (type === 'home') {
      return '/all';
    }
    if (type === 'region') {
      return `/regions/${region}/all`;
    } else return '/all';
  };

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
        {(type === 'home' || type === 'region') && (
          <Button
            className="my-8 w-full border-slate-300 py-5 text-slate-400"
            onClick={() => posthog.capture('viewall bottom_listings')}
            size="sm"
            variant="outline"
            asChild
          >
            <Link className="ph-no-capture" href={viewAllLink()}>
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}
      </>
    );
  };

  return (
    <div className="mt-5 mb-10">
      <div className="flex w-full items-center justify-between md:mb-1.5">
        <div className="flex items-center">
          <p className="text-lg font-semibold text-slate-800">
            Browse Opportunities
          </p>

          <div className="hidden items-center md:flex">
            <Separator orientation="vertical" className="mx-3 h-6" />
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
        </div>

        <ListingFilters
          activeStatus={activeStatus}
          activeSortBy={activeSortBy}
          activeOrder={activeOrder}
          onStatusChange={handleStatusChange}
          onSortChange={handleSortChange}
        />
      </div>
      <div className="mt-2 mb-1 md:hidden">
        {TABS.map((tab) => (
          <ListingTabTrigger
            key={tab.id}
            isActive={activeTab === tab.id}
            onClick={() => handleTabChange(tab.id, tab.posthog)}
          >
            <span className="text-sm font-medium md:text-base">
              {tab.title}
            </span>
          </ListingTabTrigger>
        ))}
      </div>

      <div className="mb-2 h-px w-full bg-slate-200" />

      <div className="flex gap-1 overflow-x-auto py-1">
        {potentialSession && (
          <CategoryPill
            key="foryou"
            phEvent="foryou_navpill"
            isActive={activeCategory === 'For You'}
            onClick={() => handleCategoryChange('For You', 'foryou_navpill')}
          >
            For You
          </CategoryPill>
        )}
        <CategoryPill
          key="all"
          phEvent="all_navpill"
          isActive={activeCategory === 'All'}
          onClick={() => handleCategoryChange('All', 'all_navpill')}
        >
          All
        </CategoryPill>
        {CATEGORY_NAV_ITEMS?.map((navItem) => (
          <CategoryPill
            key={navItem.label}
            phEvent={navItem.pillPH}
            isActive={activeCategory === navItem.label}
            onClick={() => handleCategoryChange(navItem.label, navItem.pillPH)}
          >
            {isMd ? navItem.label : navItem.mobileLabel || navItem.label}
          </CategoryPill>
        ))}
      </div>

      {renderContent()}
    </div>
  );
};
