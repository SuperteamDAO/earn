'use client';

import type { ReactNode } from 'react';

import { EmptySection } from '@/components/shared/EmptySection';
import { Separator } from '@/components/ui/separator';
import { useScrollShadow } from '@/hooks/use-scroll-shadow';
import { cn } from '@/utils/cn';

import { HACKATHONS } from '@/features/hackathon/constants/hackathons';
import type { ListingCardData } from '@/features/home/types/cards';
import { CATEGORY_NAV_ITEMS } from '@/features/navbar/constants';

import type { ListingCategory, ListingContext } from '../hooks/useListings';
import { type ListingState, useListingState } from '../hooks/useListingState';
import { AddListingCard } from './AddListingCard';
import { CategoryPill } from './CategoryPill';
import { ListingCard } from './ListingCard';
import { ListingFilters } from './ListingFilters';
import { ListingTabs } from './ListingTabs';
import { ViewAllButton } from './ViewAllButton';

const PILL_CATEGORIES = ['Content', 'Design', 'Development', 'Other'] as const;
const asCategory = (label: string): ListingCategory =>
  PILL_CATEGORIES.find((category) => category === label) ?? 'All';

interface ListingsSectionViewProps {
  readonly type: ListingContext;
  // The list for `state`, rendered on the server; null when it failed.
  readonly listings: ReadonlyArray<ListingCardData> | null;
  readonly now: number;
  readonly state: ListingState;
  readonly defaults: ListingState;
  // The category pill a category page is fixed to.
  readonly category?: ListingCategory;
  readonly showForYou: boolean;
  readonly showAddListingCard: boolean;
  // What an empty list shows for these filters, when not Earn's default.
  readonly emptySection?: ReactNode;
}

export const ListingsSectionView = ({
  type,
  listings,
  now,
  state,
  defaults,
  category,
  showForYou,
  showAddListingCard,
  emptySection,
}: ListingsSectionViewProps) => {
  const isSponsorContext = type === 'sponsor';
  const isBookmarksContext = type === 'bookmarks';

  const {
    ref: scrollContainerRef,
    showLeftShadow,
    showRightShadow,
  } = useScrollShadow<HTMLDivElement>();

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
  } = useListingState({ state, defaults });

  // For category contexts, use the category prop (route category)
  // For other contexts, use activeCategory (filter selection)
  const effectiveCategory =
    type === 'category' && category
      ? category
      : type === 'bookmarks' && activeCategory === 'For You'
        ? 'All'
        : activeCategory;

  const visibleCategoryNavItems = CATEGORY_NAV_ITEMS;

  const viewAllLink = () => {
    if (HACKATHONS.some((hackathon) => hackathon.slug === activeTab)) {
      return `/earn/hackathon/${activeTab}/`;
    }
    const params = new URLSearchParams();
    params.set('category', activeCategory);
    if (activeStatus) params.set('status', activeStatus);
    if (activeSortBy) params.set('sortBy', activeSortBy);
    if (activeOrder) params.set('order', activeOrder);
    if (activeTab) params.set('tab', activeTab);
    if (activeCategory) params.set('category', activeCategory);

    return `/earn/all/?${params.toString()}`;
  };

  const handleForYouClick = () => {
    handleCategoryChange('For You', 'foryou_navpill');
  };

  const handleAllCategoryClick = () => {
    handleCategoryChange('All', 'all_navpill');
  };

  const renderContent = () => {
    if (!listings) {
      return <EmptySection title="Error loading listings" />;
    }

    if (!listings.length) {
      return (
        <>
          {showAddListingCard && (
            <div className="hidden lg:block">
              <AddListingCard listingType="bounty" />
            </div>
          )}
          {emptySection ?? (
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
        {showAddListingCard && (
          <div className="hidden lg:block">
            <AddListingCard listingType="bounty" />
          </div>
        )}
        {listings.map((listing) => (
          <ListingCard key={listing.id} bounty={listing} now={now} />
        ))}
        {type === 'home' && (
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
    return 'Browse Opportunities';
  };

  return (
    <div className="mt-5 mb-10">
      <div className="flex w-full items-center justify-between md:mb-1.5">
        {isBookmarksContext ? (
          <p className="mb-2 text-xl font-semibold text-slate-700">Bookmarks</p>
        ) : (
          <div className="flex items-center">
            <p className="text-lg font-semibold text-slate-800">{getTitle()}</p>

            <div className="hidden items-center md:flex">
              <Separator orientation="vertical" className="mx-3 h-6" />
              <ListingTabs
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
          showAllFilter={isSponsorContext || isBookmarksContext}
          showStatusSort={isSponsorContext || isBookmarksContext}
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
      {type !== 'category' && (
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
            {showForYou && (
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
                    asCategory(navItem.label),
                    navItem.pillPH,
                  )
                }
              >
                {/* The short label below md, as Earn's isMd chose. */}
                <span className="hidden md:inline">{navItem.label}</span>
                <span className="md:hidden">
                  {navItem.mobileLabel || navItem.label}
                </span>
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

      {renderContent()}
    </div>
  );
};
