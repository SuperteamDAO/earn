'use client';

import { AnimateChangeInHeight } from '@/components/shared/AnimateChangeInHeight';
import { EmptySection } from '@/components/shared/EmptySection';
import { ExternalImage } from '@/components/ui/cloudinary-image';

import type { ListingCardData } from '@/features/home/types/cards';
import { ViewAllButton } from '@/features/listings/components/ViewAllButton';

import { CategoryPill } from '../../listings/components/CategoryPill';
import { ListingCard } from '../../listings/components/ListingCard';
import { HACKATHONS } from '../constants/hackathons';
import type { HackathonContext } from '../hooks/useHackathons';
import { useHackathonState } from '../hooks/useHackathonState';
import { HackathonFilters } from './HackathonFilters';

interface HackathonSectionProps {
  type: HackathonContext;
  // The list for the page's search params, loaded on the server; null when
  // it couldn't be.
  listings: ReadonlyArray<ListingCardData> | null;
  // The server's clock when it loaded them.
  now: number;
}

export const HackathonSection = ({
  type,
  listings,
  now,
}: HackathonSectionProps) => {
  const {
    activeName,
    activeStatus,
    activeSortBy,
    activeOrder,
    handleNameChange,
    handleStatusChange,
    handleSortChange,
  } = useHackathonState();

  const viewAllHackathonLink = () => {
    const basePath = '/hackathon/all';
    const params = new URLSearchParams();
    params.set('name', activeName);
    if (activeStatus) params.set('status', activeStatus);
    if (activeSortBy) params.set('sortBy', activeSortBy);
    if (activeOrder) params.set('order', activeOrder);
    return `${basePath}?${params.toString()}`;
  };

  const renderContent = () => {
    if (!listings) {
      return <EmptySection title="Error loading listings" />;
    }

    if (!listings.length) {
      return (
        <EmptySection
          title="No opportunities found"
          message="We don't have any relevant opportunities for the current filters."
        />
      );
    }

    return (
      <>
        {listings.map((listing) => (
          <ListingCard key={listing.id} bounty={listing} now={now} />
        ))}
        {type === 'home' && (
          <ViewAllButton
            posthogEvent="viewall bottom_hackathons"
            href={viewAllHackathonLink()}
          />
        )}
      </>
    );
  };

  return (
    <div className="mt-5 mb-10">
      <div className="flex w-full items-center justify-between md:mb-1.5">
        <div className="flex items-center">
          <p className="text-lg font-semibold text-slate-800">
            Hackathon Tracks
          </p>
        </div>

        <HackathonFilters
          activeStatus={activeStatus}
          activeSortBy={activeSortBy}
          activeOrder={activeOrder}
          onStatusChange={handleStatusChange}
          onSortChange={handleSortChange}
        />
      </div>

      <div className="mb-2 h-px w-full bg-slate-200" />

      <div className="relative -mx-2 mb-1">
        <div className="hide-scrollbar flex gap-1.5 overflow-x-auto px-2 py-1">
          <CategoryPill
            key="all"
            phEvent="all_navpill"
            isActive={activeName === 'All'}
            onClick={() => handleNameChange('All', 'all_navpill')}
          >
            All
          </CategoryPill>
          {HACKATHONS?.map((hackathon) => (
            <CategoryPill
              key={hackathon.slug}
              phEvent={`${hackathon.slug}_navpill`}
              isActive={activeName === hackathon.label}
              onClick={() =>
                handleNameChange(hackathon.label, `${hackathon.slug}_navpill`)
              }
            >
              <ExternalImage
                src={hackathon.logo}
                alt={hackathon.label}
                className="h-3 w-auto object-contain"
              />
            </CategoryPill>
          ))}
        </div>
      </div>

      <AnimateChangeInHeight disableOnHeightZero>
        {renderContent()}
      </AnimateChangeInHeight>
    </div>
  );
};
