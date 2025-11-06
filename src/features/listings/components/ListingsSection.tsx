import { usePrivy } from '@privy-io/react-auth';
import { useMemo } from 'react';

import { AnimateChangeInHeight } from '@/components/shared/AnimateChangeInHeight';
import { EmptySection } from '@/components/shared/EmptySection';
import { Separator } from '@/components/ui/separator';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useScrollShadow } from '@/hooks/use-scroll-shadow';
import { cn } from '@/utils/cn';

import { HACKATHONS } from '@/features/hackathon/constants/hackathons';
import { CATEGORY_NAV_ITEMS } from '@/features/navbar/constants';

import {
  type ListingCategory,
  type ListingContext,
  type ListingSortOption,
  type ListingStatus,
  type ListingTab,
  useListings,
} from '../hooks/useListings';
import { useListingsFilterCount } from '../hooks/useListingsFilterCount';
import { useListingState } from '../hooks/useListingState';
import type { ListingTabsProps } from '../types';
import { CategoryPill } from './CategoryPill';
import { ListingCard, ListingCardSkeleton } from './ListingCard';
import { ListingFilters } from './ListingFilters';
import { ListingTabs } from './ListingTabs';
import { ViewAllButton } from './ViewAllButton';

export type EmptySectionFilters = {
  activeTab: ListingTab;
  activeCategory: ListingCategory;
  activeStatus: ListingStatus;
  activeSortBy: ListingSortOption;
};

interface ListingsSectionProps extends ListingTabsProps {
  customEmptySection?:
    | React.ReactNode
    | ((filters: EmptySectionFilters) => React.ReactNode);
}
const FOR_YOU_SUPPORTED_TYPES: ReadonlyArray<ListingContext> = [
  'home',
  'all',
] as const;

export const ListingsSection = ({
  type,
  potentialSession,
  region,
  sponsor,
  customEmptySection,
}: ListingsSectionProps) => {
  const isMd = useBreakpoint('md');

  const { authenticated, ready } = usePrivy();
  const supportsForYou = FOR_YOU_SUPPORTED_TYPES.includes(type);
  const {
    ref: scrollContainerRef,
    showLeftShadow,
    showRightShadow,
  } = useScrollShadow<HTMLDivElement>();

  const { data: categoryCounts, isLoading: countsLoading } =
    useListingsFilterCount({
      context: type,
      tab: 'all',
      status: 'open',
      region,
      sponsor,
      authenticated,
    });

  const optimalDefaultCategory = useMemo((): ListingCategory => {
    if (countsLoading || !categoryCounts) {
      return (potentialSession || (ready && authenticated)) && supportsForYou
        ? 'For You'
        : 'All';
    }

    const forYouCount = categoryCounts['For You'] || 0;

    if (
      (potentialSession || (ready && authenticated)) &&
      supportsForYou &&
      forYouCount > 2
    ) {
      return 'For You';
    }

    return 'All';
  }, [
    categoryCounts,
    countsLoading,
    potentialSession,
    authenticated,
    ready,
    supportsForYou,
  ]);

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
    defaultCategory: optimalDefaultCategory,
    defaultStatus: type === 'sponsor' ? 'all' : undefined,
    defaultSortBy: type === 'sponsor' ? 'Status' : undefined,
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
    authenticated,
  });

  const shouldShowForYou = useMemo(() => {
    if (!categoryCounts) return false;
    return (
      (potentialSession || (ready && authenticated)) &&
      supportsForYou &&
      (categoryCounts['For You'] || 0) > 2
    );
  }, [categoryCounts, potentialSession, authenticated, ready, supportsForYou]);

  const visibleCategoryNavItems = useMemo(() => {
    return CATEGORY_NAV_ITEMS;
  }, []);

  const viewAllLink = () => {
    if (HACKATHONS.some((hackathon) => hackathon.slug === activeTab)) {
      return `/hackathon/${activeTab}`;
    }
    let basePath: string;
    if (type === 'home') {
      basePath = '/all';
    } else if (type === 'region') {
      basePath = `/regions/${region}/all`;
    } else {
      basePath = '/all';
    }

    const params = new URLSearchParams();
    params.set('category', activeCategory);
    if (activeStatus) params.set('status', activeStatus);
    if (activeSortBy) params.set('sortBy', activeSortBy);
    if (activeOrder) params.set('order', activeOrder);
    if (activeTab) params.set('tab', activeTab);
    if (activeCategory) params.set('category', activeCategory);

    return `${basePath}?${params.toString()}`;
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
      const emptySectionContent =
        typeof customEmptySection === 'function'
          ? customEmptySection({
              activeTab,
              activeCategory,
              activeStatus,
              activeSortBy,
            })
          : customEmptySection;

      return (
        emptySectionContent ?? (
          <EmptySection
            title="No opportunities found"
            message="We don't have any relevant opportunities for the current filters."
          />
        )
      );
    }

    return (
      <div className="space-y-1">
        {listings.map((listing) => (
          <ListingCard key={listing.id} bounty={listing} />
        ))}
        {(type === 'home' || type === 'region') && (
          <ViewAllButton
            posthogEvent="viewall bottom_listings"
            href={viewAllLink()}
          />
        )}
      </div>
    );
  };

  return (
    <div className="mt-5 mb-10">
      <div className="flex w-full items-center justify-between md:mb-1.5">
        <div className="flex items-center">
          <p className="text-lg font-semibold text-slate-800">
            {type === 'sponsor' ? 'All Listings' : 'Browse Opportunities'}
          </p>

          <div className="hidden items-center md:flex">
            <Separator orientation="vertical" className="mx-3 h-6" />
            <ListingTabs
              type={type}
              activeTab={activeTab}
              handleTabChange={handleTabChange}
            />
          </div>
        </div>

        <ListingFilters
          activeStatus={activeStatus}
          activeSortBy={activeSortBy}
          activeOrder={activeOrder}
          onStatusChange={handleStatusChange}
          onSortChange={handleSortChange}
          showAllFilter={type === 'sponsor'}
          showStatusSort={type === 'sponsor'}
        />
      </div>
      <div className="mt-2 mb-1 md:hidden">
        <ListingTabs
          type={type}
          activeTab={activeTab}
          handleTabChange={handleTabChange}
        />
      </div>

      <div className="mb-2 h-px w-full bg-slate-200" />
      <div className="relative -mx-2 mb-1">
        <div
          className={cn(
            'pointer-events-none absolute top-0 bottom-0 left-0 z-10 w-8',
            'bg-gradient-to-r from-white/80 via-white/30 to-transparent',
            'transition-opacity duration-300 ease-in-out',
            showLeftShadow ? 'opacity-100' : 'opacity-0',
          )}
        />

        <div
          ref={scrollContainerRef}
          className="hide-scrollbar flex gap-1.5 overflow-x-auto px-2 py-1"
        >
          {shouldShowForYou && (
            <CategoryPill
              key="foryou"
              phEvent="foryou_navpill"
              isActive={activeCategory === 'For You'}
              onClick={() =>
                handleCategoryChange(
                  'For You' as ListingCategory,
                  'foryou_navpill',
                )
              }
            >
              For You
            </CategoryPill>
          )}
          <CategoryPill
            key="all"
            phEvent="all_navpill"
            isActive={activeCategory === 'All'}
            onClick={() =>
              handleCategoryChange('All' as ListingCategory, 'all_navpill')
            }
          >
            All
          </CategoryPill>
          {visibleCategoryNavItems?.map((navItem) => (
            <CategoryPill
              key={navItem.label}
              phEvent={navItem.pillPH}
              isActive={activeCategory === navItem.label}
              onClick={() =>
                handleCategoryChange(
                  navItem.label as ListingCategory,
                  navItem.pillPH,
                )
              }
            >
              {isMd ? navItem.label : navItem.mobileLabel || navItem.label}
            </CategoryPill>
          ))}
        </div>
        <div
          className={cn(
            'pointer-events-none absolute top-0 right-0 bottom-0 z-10 w-8',
            'bg-gradient-to-l from-white/80 via-white/30 to-transparent',
            'transition-opacity duration-300 ease-in-out',
            showRightShadow ? 'opacity-100' : 'opacity-0',
          )}
        />
      </div>

      <AnimateChangeInHeight disableOnHeightZero>
        {renderContent()}
      </AnimateChangeInHeight>
    </div>
  );
};
