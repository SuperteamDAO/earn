import { usePrivy } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { AnimateChangeInHeight } from '@/components/shared/AnimateChangeInHeight';
import { EmptySection } from '@/components/shared/EmptySection';
import { Separator } from '@/components/ui/separator';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useScrollShadow } from '@/hooks/use-scroll-shadow';
import { cn } from '@/utils/cn';

import { HACKATHONS } from '@/features/hackathon/constants/hackathons';
import { sponsorStageQuery } from '@/features/home/queries/sponsor-stage';
import { SponsorStage } from '@/features/home/types/sponsor-stage';
import { getRegionSlug } from '@/features/listings/utils/region';
import { CATEGORY_NAV_ITEMS } from '@/features/navbar/constants';

const SKELETON_COUNT = 5;
const skeletonArray = Array.from({ length: SKELETON_COUNT }, (_, i) => i);

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
import { AddListingCard } from './AddListingCard';
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
  skill,
  category,
  defaultTab,
  customEmptySection,
}: ListingsSectionProps) => {
  const isMd = useBreakpoint('md');
  const isLg = useBreakpoint('lg');
  const isSponsorContext = type === 'sponsor';
  const isBookmarksContext = type === 'bookmarks';
  const isProContext = type === 'pro';
  const isAgentContext = type === 'agents';

  const { authenticated, ready } = usePrivy();
  const supportsForYou = FOR_YOU_SUPPORTED_TYPES.includes(type);

  const { data: sponsorStageData } = useQuery({
    ...sponsorStageQuery,
    enabled: false,
  });

  const shouldShowAddListingCard = useMemo(() => {
    if (type !== 'home') return false;
    if (!isLg) return false;
    if (!sponsorStageData?.stage) return false;
    return (
      sponsorStageData.stage === SponsorStage.NEW_SPONSOR ||
      sponsorStageData.stage === SponsorStage.NEXT_LISTING
    );
  }, [sponsorStageData, isLg, type]);

  const {
    ref: scrollContainerRef,
    showLeftShadow,
    showRightShadow,
  } = useScrollShadow<HTMLDivElement>();

  const { data: categoryCounts, isLoading: countsLoading } =
    useListingsFilterCount({
      context: type,
      tab: defaultTab ?? 'all',
      status: 'open',
      region,
      sponsor,
      skill,
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
    defaultStatus:
      isSponsorContext || isBookmarksContext || isProContext
        ? 'all'
        : undefined,
    defaultSortBy:
      isSponsorContext || isBookmarksContext || isProContext
        ? 'Status'
        : undefined,
    defaultTab,
  });

  // For category contexts, use the category prop (route category)
  // For other contexts, use activeCategory (filter selection)
  const effectiveCategory =
    type === 'category' || type === 'category-all'
      ? (category as ListingCategory)
      : (type === 'bookmarks' || type === 'pro') && activeCategory === 'For You'
        ? ('All' as ListingCategory)
        : activeCategory;

  const {
    data: listings,
    isLoading,
    error,
  } = useListings({
    context: type,
    tab: activeTab,
    category: effectiveCategory,
    status: activeStatus,
    sortBy: activeSortBy,
    order: activeOrder,
    region,
    sponsor,
    skill,
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

  const visibleCategoryNavItems = CATEGORY_NAV_ITEMS;

  const viewAllLink = () => {
    if (HACKATHONS.some((hackathon) => hackathon.slug === activeTab)) {
      return `/earn/hackathon/${activeTab}`;
    }
    let basePath: string;
    if (type === 'home') {
      basePath = '/earn/all';
    } else if (type === 'region') {
      basePath = `/earn/regions/${getRegionSlug(region || '')}/all`;
    } else if (type === 'skill' && skill) {
      basePath = `/earn/skill/${skill}/all`;
    } else {
      basePath = '/earn/all';
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

  const handleForYouClick = useCallback(() => {
    handleCategoryChange('For You' as ListingCategory, 'foryou_navpill');
  }, [handleCategoryChange]);

  const handleAllCategoryClick = useCallback(() => {
    handleCategoryChange('All' as ListingCategory, 'all_navpill');
  }, [handleCategoryChange]);

  const renderContent = () => {
    if (isLoading) {
      return skeletonArray.map((index) => <ListingCardSkeleton key={index} />);
    }

    if (error) {
      return <EmptySection title="Error loading listings" />;
    }

    if (!listings?.length) {
      const emptySectionContent =
        typeof customEmptySection === 'function'
          ? customEmptySection({
              activeTab,
              activeCategory: effectiveCategory,
              activeStatus,
              activeSortBy,
            })
          : customEmptySection;

      return (
        <>
          {shouldShowAddListingCard && (
            <AddListingCard
              listingType={
                activeTab === 'bounties'
                  ? 'bounty'
                  : activeTab === 'projects'
                    ? 'project'
                    : 'bounty'
              }
            />
          )}
          {emptySectionContent ?? (
            <EmptySection
              title="No opportunities found"
              message="We don't have any relevant opportunities for the current filters."
            />
          )}
        </>
      );
    }

    return (
      <div className="space-y-1">
        {shouldShowAddListingCard && (
          <AddListingCard
            listingType={
              activeTab === 'bounties'
                ? 'bounty'
                : activeTab === 'projects'
                  ? 'project'
                  : 'bounty'
            }
          />
        )}
        {listings.map((listing) => (
          <ListingCard key={listing.id} bounty={listing} />
        ))}
        {(type === 'home' || type === 'region' || type === 'skill') && (
          <ViewAllButton
            posthogEvent="viewall bottom_listings"
            href={viewAllLink()}
          />
        )}
      </div>
    );
  };

  const getTitle = () => {
    if (isSponsorContext) {
      return 'All Listings';
    }
    if (isProContext) {
      return 'Premium Listings';
    }
    if (isAgentContext) {
      return 'Agent-eligible listings';
    }
    return 'Browse Opportunities';
  };

  return (
    <div className="mt-5 mb-10">
      <div className="flex w-full items-center justify-between md:mb-1.5">
        {isBookmarksContext ? (
          <p className="mb-2 text-xl font-semibold text-slate-700">Bookmarks</p>
        ) : (
          <div className="flex items-center">
            <h2 className="text-lg font-semibold text-slate-800">{getTitle()}</h2>

            <div className="hidden items-center md:flex">
              <Separator orientation="vertical" className="mx-3 h-6" />
              <ListingTabs
                isPro={isProContext}
                type={type}
                activeTab={activeTab}
                handleTabChange={handleTabChange}
              />
            </div>
          </div>
        )}

        <ListingFilters
          activeStatus={activeStatus}
          activeSortBy={activeSortBy}
          activeOrder={activeOrder}
          onStatusChange={handleStatusChange}
          onSortChange={handleSortChange}
          showAllFilter={isSponsorContext || isBookmarksContext || isProContext}
          showStatusSort={
            isSponsorContext || isBookmarksContext || isProContext
          }
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
      {type !== 'category' && type !== 'category-all' && (
        <div className="relative -mx-2 mb-1">
          <div
            className={cn(
              'pointer-events-none absolute top-0 bottom-0 left-0 z-10 w-8',
              'bg-linear-to-r from-white/80 via-white/30 to-transparent',
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
                onClick={handleForYouClick}
              >
                For You
              </CategoryPill>
            )}
            <CategoryPill
              key="all"
              phEvent="all_navpill"
              isActive={effectiveCategory === 'All'}
              onClick={handleAllCategoryClick}
              isPro={isProContext}
            >
              All
            </CategoryPill>
            {visibleCategoryNavItems?.map((navItem) => (
              <CategoryPill
                key={navItem.label}
                phEvent={navItem.pillPH}
                isActive={effectiveCategory === navItem.label}
                onClick={() =>
                  handleCategoryChange(
                    navItem.label as ListingCategory,
                    navItem.pillPH,
                  )
                }
                isPro={isProContext}
              >
                {isMd ? navItem.label : navItem.mobileLabel || navItem.label}
              </CategoryPill>
            ))}
          </div>
          <div
            className={cn(
              'pointer-events-none absolute top-0 right-0 bottom-0 z-10 w-8',
              'bg-linear-to-l from-white/80 via-white/30 to-transparent',
              'transition-opacity duration-300 ease-in-out',
              showRightShadow ? 'opacity-100' : 'opacity-0',
            )}
          />
        </div>
      )}

      <AnimateChangeInHeight disableOnHeightZero>
        {renderContent()}
      </AnimateChangeInHeight>
    </div>
  );
};
