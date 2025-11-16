import { AnimateChangeInHeight } from '@/components/shared/AnimateChangeInHeight';
import { EmptySection } from '@/components/shared/EmptySection';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { cn } from '@/utils/cn';

import { CategoryPill } from '@/features/listings/components/CategoryPill';
import { ListingCardSkeleton } from '@/features/listings/components/ListingCard';
import { ViewAllButton } from '@/features/listings/components/ViewAllButton';
import { CATEGORY_NAV_ITEMS } from '@/features/navbar/constants';

import { type GrantContext, useGrants } from '../hooks/useGrants';
import { useGrantState } from '../hooks/useGrantState';
import { GrantsCard } from './GrantsCard';

interface GrantSectionProps {
  type: GrantContext;
  region?: string;
  sponsor?: string;
  hideWhenEmpty?: boolean;
}

export const GrantsSection = ({
  type,
  region,
  sponsor,
  hideWhenEmpty,
}: GrantSectionProps) => {
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

  if (hideWhenEmpty && !isLoading && !grants?.length) {
    return null;
  }

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
          <ViewAllButton posthogEvent="viewall bottom_grants" href="/grants" />
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

      <AnimateChangeInHeight disableOnHeightZero>
        {renderContent()}
      </AnimateChangeInHeight>
    </div>
  );
};
