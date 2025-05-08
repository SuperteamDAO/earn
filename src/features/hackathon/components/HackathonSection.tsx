import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { usePostHog } from 'posthog-js/react';

import { EmptySection } from '@/components/shared/EmptySection';
import { Button } from '@/components/ui/button';
import { ExternalImage } from '@/components/ui/cloudinary-image';

import { CategoryPill } from '../../listings/components/CategoryPill';
import {
  ListingCard,
  ListingCardSkeleton,
} from '../../listings/components/ListingCard';
import { type HackathonContext, useHackathons } from '../hooks/useHackathons';
import { useHackathonState } from '../hooks/useHackathonState';
import { HackathonFilters } from './HackathonFilters';

export interface HackathonSectionProps {
  type: HackathonContext;
}

const HACKATHONS = [
  {
    label: 'Breakout',
    slug: 'breakout',
    logo: '/hackathon/breakout/logo',
  },
  {
    label: 'Redacted',
    slug: 'redacted',
    logo: '/hackathon/redacted/logo-black',
  },
];

export const HackathonSection = ({ type }: HackathonSectionProps) => {
  const posthog = usePostHog();

  const {
    activeName,
    activeStatus,
    activeSortBy,
    activeOrder,
    handleNameChange,
    handleStatusChange,
    handleSortChange,
  } = useHackathonState();

  const {
    data: listings,
    isLoading,
    error,
  } = useHackathons({
    name: activeName,
    status: activeStatus,
    sortBy: activeSortBy,
    order: activeOrder,
    context: type,
  });

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
          <Button
            className="my-8 w-full border-slate-300 py-5 text-slate-400"
            onClick={() => posthog.capture('viewall bottom_listings')}
            size="sm"
            variant="outline"
            asChild
          >
            <Link className="ph-no-capture" href={'/hackathon/all'}>
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

      <div className="flex gap-1 overflow-x-auto py-1">
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
              className="h-full object-contain"
            />
          </CategoryPill>
        ))}
      </div>

      {renderContent()}
    </div>
  );
};
