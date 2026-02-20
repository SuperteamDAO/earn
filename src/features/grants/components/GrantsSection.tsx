import { useCallback } from 'react';

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

const SKELETON_COUNT = 5;
const skeletonArray = Array.from({ length: SKELETON_COUNT }, (_, i) => i);

interface GrantSectionProps {
  type: GrantContext;
  region?: string;
  sponsor?: string;
  skill?: string;
  category?: string;
  hideWhenEmpty?: boolean;
}

export const GrantsSection = ({
  type,
  region,
  sponsor,
  skill,
  category: categoryProp,
  hideWhenEmpty,
}: GrantSectionProps) => {
  const { activeCategory, handleCategoryChange } = useGrantState();
  const isProContext = type === 'pro';

  // For category contexts, use the category prop (route category)
  // For other contexts, use activeCategory (filter selection)
  const effectiveCategory =
    type === 'category' || type === 'category-all'
      ? categoryProp || activeCategory
      : activeCategory;
  const isMd = useBreakpoint('md');

  const getTitle = () => {
    if (isProContext) {
      return 'Premium Grants';
    }
    return 'Grants';
  };

  const {
    data: grants,
    isLoading,
    error,
  } = useGrants({
    context: type,
    category: effectiveCategory,
    region,
    sponsor,
    skill,
  });

  const handleAllCategoryClick = useCallback(() => {
    handleCategoryChange('All', 'all_navpill');
  }, [handleCategoryChange]);

  if (hideWhenEmpty && !isLoading && !grants?.length) {
    return null;
  }

  const renderContent = () => {
    if (isLoading) {
      return skeletonArray.map((index) => <ListingCardSkeleton key={index} />);
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
          <ViewAllButton
            posthogEvent="viewall bottom_grants"
            href="/earn/grants"
          />
        )}
      </>
    );
  };

  return (
    <div className={cn('mx-auto my-10 w-[98%] md:w-full')}>
      <h2
        className={cn(
          'mb-1.5 text-lg font-semibold',
          isProContext ? 'text-zinc-800' : 'text-slate-800',
        )}
      >
        {getTitle()}
      </h2>

      <div
        className={cn(
          'mb-3 h-px w-full',
          isProContext ? 'bg-zinc-200' : 'bg-slate-200',
        )}
      />

      {type !== 'category' && type !== 'category-all' && (
        <div className="mb-2 flex gap-1 overflow-x-auto pb-1">
          <CategoryPill
            key="all"
            phEvent="all_navpill"
            isActive={activeCategory === 'All'}
            onClick={handleAllCategoryClick}
            isPro={isProContext}
          >
            All
          </CategoryPill>
          {CATEGORY_NAV_ITEMS?.map((navItem) => (
            <CategoryPill
              key={navItem.label}
              phEvent={navItem.pillPH}
              isActive={activeCategory === navItem.label}
              onClick={() =>
                handleCategoryChange(navItem.label, navItem.pillPH)
              }
              isPro={isProContext}
            >
              {isMd ? navItem.label : navItem.mobileLabel || navItem.label}
            </CategoryPill>
          ))}
        </div>
      )}

      <AnimateChangeInHeight disableOnHeightZero>
        {renderContent()}
      </AnimateChangeInHeight>
    </div>
  );
};
