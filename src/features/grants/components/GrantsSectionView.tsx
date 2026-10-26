'use client';

import { EmptySection } from '@/components/shared/EmptySection';
import { cn } from '@/utils/cn';

import type { GrantCardData } from '@/features/home/types/cards';
import { CategoryPill } from '@/features/listings/components/CategoryPill';
import { ViewAllButton } from '@/features/listings/components/ViewAllButton';
import { CATEGORY_NAV_ITEMS } from '@/features/navbar/constants';

import { useGrantState } from '../hooks/useGrantState';
import { GrantsCard } from './GrantsCard';

interface GrantsSectionViewProps {
  readonly type: 'home' | 'all' | 'region' | 'sponsor' | 'category';
  // The list for `category`, rendered on the server; null when it failed.
  readonly grants: ReadonlyArray<
    GrantCardData & { readonly id: string }
  > | null;
  readonly category: string;
  readonly hideCategoryPills?: boolean;
}

export const GrantsSectionView = ({
  type,
  grants,
  category,
  hideCategoryPills,
}: GrantsSectionViewProps) => {
  const { activeCategory, handleCategoryChange } = useGrantState(category);

  const handleAllCategoryClick = () => {
    handleCategoryChange('All', 'all_navpill');
  };

  const renderContent = () => {
    if (!grants) {
      return <EmptySection title="Error loading grants" />;
    }

    if (!grants.length) {
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
            href="/earn/grants/"
          />
        )}
      </>
    );
  };

  return (
    <div className={cn('mx-auto my-10 w-[98%] md:w-full')}>
      <p className="mb-1.5 text-lg font-semibold text-slate-800">Grants</p>

      <div className="mb-3 h-px w-full bg-slate-200" />

      {!hideCategoryPills && type !== 'category' && (
        <div className="mb-2 flex gap-1 overflow-x-auto pb-1">
          <CategoryPill
            key="all"
            phEvent="all_navpill"
            isActive={activeCategory === 'All'}
            onClick={handleAllCategoryClick}
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
            >
              {/* The short label below md, as Earn's isMd chose. */}
              <span className="hidden md:inline">{navItem.label}</span>
              <span className="md:hidden">
                {navItem.mobileLabel || navItem.label}
              </span>
            </CategoryPill>
          ))}
        </div>
      )}

      {renderContent()}
    </div>
  );
};
