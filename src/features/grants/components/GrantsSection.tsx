import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { usePostHog } from 'posthog-js/react';

import { EmptySection } from '@/components/shared/EmptySection';
import { Button } from '@/components/ui/button';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { cn } from '@/utils/cn';

import { CategoryPill } from '@/features/listings/components/CategoryPill';
import { ListingCardSkeleton } from '@/features/listings/components/ListingCard';
import { CATEGORY_NAV_ITEMS } from '@/features/navbar/constants';

import { type GrantContext, useGrants } from '../hooks/useGrants';
import { useGrantState } from '../hooks/useGrantState';
import { GrantsCard } from './GrantsCard';

export interface GrantSectionProps {
  type: GrantContext;
  region?: string;
  sponsor?: string;
}

export const GrantsSection = ({ type, region, sponsor }: GrantSectionProps) => {
  const { activeCategory, handleCategoryChange } = useGrantState();
  const isMd = useBreakpoint('md');

  const {
    data: grants,
    isLoading,
    error,
  } = useGrants({
    context: type,
    category: activeCategory,
    region,
    sponsor,
  });

  const posthog = usePostHog();

  const renderContent = () => {
    if (isLoading) {
      return Array.from({ length: 5 }).map((_, index) => (
        <ListingCardSkeleton key={index} />
      ));
    }

    if (error) {
      return <EmptySection title="Error loading grants" />;
    }

    if (!grants?.length) {
      return <EmptySection title="No grants found" />;
    }

    return (
      <>
        {grants.map((grant) => (
          <GrantsCard key={grant.id} grant={grant} />
        ))}
        {type === 'home' && (
          <Button
            className="my-8 w-full border-slate-300 py-5 text-slate-400"
            onClick={() => posthog.capture('viewall bottom_listings')}
            size="sm"
            variant="outline"
            asChild
          >
            <Link className="ph-no-capture" href={`/grants`}>
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}
      </>
    );
  };

  return (
    <div className={cn('mx-auto my-10 w-[98%] md:w-full')}>
      <p className="mb-1.5 text-lg font-semibold text-slate-800">Grants</p>

      <div className="mb-3 h-px w-full bg-slate-200" />

      <div className="mb-2 flex gap-1 overflow-x-auto pb-1">
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
