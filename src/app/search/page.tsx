'use client';

import { useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';
import { useEffect, useMemo, useState } from 'react';

import { AnimateChangeInHeight } from '@/components/shared/AnimateChangeInHeight';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { useUser } from '@/store/user';

import { DropdownFilter } from '@/features/search/components/DropdownFilter';
import { PillsFilter } from '@/features/search/components/PillsFilter';
import { QueryInput } from '@/features/search/components/QueryInput';
import { Results } from '@/features/search/components/Results';
import { useSearchListings } from '@/features/search/hooks/useSearchListings';
import { useSearchState } from '@/features/search/hooks/useSearchState';
import { getUserRegion } from '@/features/search/utils/userRegionSearch';

const SearchPage = () => {
  const searchParams = useSearchParams();
  const initialQuery = searchParams?.get('q')?.trim() || '';
  const { user } = useUser();
  const userRegion = useMemo(() => getUserRegion(user?.location), [user]);
  const [isQueryEmpty, setIsQueryEmpty] = useState(initialQuery.trim() === '');

  const {
    searchTerm,
    activeStatus,
    activeSkills,
    handleSearchTermChange,
    handleSkillsChange,
    handleToggleStatus,
    handleToggleSkill,
  } = useSearchState({
    defaultSearchTerm: initialQuery,
  });

  const {
    data,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    error,
    isLoading,
  } = useSearchListings({
    query: searchTerm,
    status: activeStatus,
    skills: activeSkills,
    bountiesLimit: 10,
    grantsLimit: 3,
    userRegion: userRegion || undefined,
  });

  const allResults = data?.pages.flatMap((page) => page.results) ?? [];
  const totalCount = data?.pages[0]?.count
    ? parseInt(data.pages[0].count, 10)
    : 0;

  useEffect(() => {
    if (isFetching) {
      NProgress.start();
    } else {
      NProgress.done();
    }
    return () => {
      NProgress.done();
    };
  }, [isFetching]);

  return (
    <Default
      meta={
        <Meta
          title={`New Search - ${searchTerm} | Superteam Earn`}
          description={`Search Results for ${searchTerm}`}
        />
      }
    >
      <div className="min-h-screen w-full bg-white">
        <div className="mx-auto flex w-full max-w-6xl gap-8 px-3 py-4 md:px-4">
          <div className="flex w-full flex-col items-start">
            <QueryInput
              query={searchTerm}
              onQueryChange={handleSearchTermChange}
              resultCount={totalCount}
              loading={isFetching}
              onQueryEmptyChange={setIsQueryEmpty}
            />

            <div className="mt-4 w-full">
              <div className="flex items-center justify-between md:px-4 md:py-2">
                <div className="hidden md:flex">
                  <PillsFilter
                    activeSkills={activeSkills}
                    onSkillsChange={handleSkillsChange}
                    disabled={isQueryEmpty}
                  />
                </div>
                <div className="px-2 md:hidden">
                  <p className="text-xs text-slate-500">
                    Found {totalCount} results
                  </p>
                </div>
                <div className="ml-auto">
                  <DropdownFilter
                    activeStatus={activeStatus}
                    activeSkills={activeSkills}
                    onStatusToggle={handleToggleStatus}
                    onSkillToggle={handleToggleSkill}
                    disabled={isQueryEmpty}
                  />
                </div>
              </div>
            </div>

            <AnimateChangeInHeight disableOnHeightZero className="w-full">
              <Results
                allResults={allResults}
                hasNextPage={!!hasNextPage}
                isFetchingNextPage={!!isFetchingNextPage}
                error={error}
                query={searchTerm}
                onFetchNextPage={fetchNextPage}
                firstRequestLoading={isLoading}
              />
            </AnimateChangeInHeight>
          </div>
        </div>
      </div>
    </Default>
  );
};

export default SearchPage;
