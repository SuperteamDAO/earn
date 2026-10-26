'use client';

import NProgress from 'nprogress';
import { useState } from 'react';

import { AnimateChangeInHeight } from '@/components/shared/AnimateChangeInHeight';
import { getJson } from '@/lib/fetch-json';

import { useSearchState } from '../hooks/useSearchState';
import type { SearchPage } from '../types';
import { DropdownFilter } from './DropdownFilter';
import { PillsFilter } from './PillsFilter';
import { QueryInput } from './QueryInput';
import { Results } from './Results';

interface SearchViewProps {
  readonly initialQuery: string;
  // The first page, rendered on the server; null when the search failed.
  readonly firstPage: SearchPage | null;
  readonly now: number;
}

const BOUNTIES_LIMIT = 10;
const GRANTS_LIMIT = 3;

// The search page's body: the query, filters and results. The server
// renders the first page; "View More" fetches the next from
// /api/search/[query] and adds it here.
export function SearchView({ initialQuery, firstPage, now }: SearchViewProps) {
  const [isQueryEmpty, setIsQueryEmpty] = useState(initialQuery.trim() === '');
  const [pages, setPages] = useState<ReadonlyArray<SearchPage>>(
    firstPage ? [firstPage] : [],
  );
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const [error, setError] = useState<unknown>(
    firstPage || !initialQuery.trim() ? null : 'search failed',
  );

  const {
    searchTerm,
    activeStatus,
    activeSkills,
    isPending,
    handleSearchTermChange,
    handleSkillsChange,
    handleToggleStatus,
    handleToggleSkill,
  } = useSearchState({
    defaultSearchTerm: initialQuery,
  });

  const allResults = pages.flatMap((page) => page.results);
  const totalCount = pages[0]?.count ? parseInt(pages[0].count, 10) : 0;
  // As Earn's getNextPageParam: more until every match is loaded.
  const hasNextPage =
    !!searchTerm.trim() &&
    pages.length > 0 &&
    allResults.length < (parseInt(pages.at(-1)?.count ?? '0', 10) || 0);

  const fetchNextPage = () => {
    const params = new URLSearchParams({
      bountiesLimit: String(BOUNTIES_LIMIT),
      grantsLimit: String(GRANTS_LIMIT),
    });
    if (activeStatus.length > 0) params.set('status', activeStatus.join(','));
    if (activeSkills.length > 0) params.set('skills', activeSkills.join(','));
    const bountiesOffset = pages.reduce((sum, p) => sum + p.bountiesCount, 0);
    const grantsOffset = pages.reduce((sum, p) => sum + p.grantsCount, 0);
    if (bountiesOffset > 0)
      params.set('bountiesOffset', String(bountiesOffset));
    if (grantsOffset > 0) params.set('grantsOffset', String(grantsOffset));
    setIsFetchingNextPage(true);
    NProgress.start();
    getJson<SearchPage>(
      `/api/search/${encodeURIComponent(searchTerm)}/?${params.toString()}`,
    )
      .then((page) => setPages((loaded) => [...loaded, page]))
      .catch((cause: unknown) => setError(cause))
      .finally(() => {
        setIsFetchingNextPage(false);
        NProgress.done();
      });
  };

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="mx-auto flex w-full max-w-6xl gap-8 px-3 py-4 md:px-4">
        <div className="flex w-full flex-col items-start">
          <QueryInput
            query={searchTerm}
            onQueryChange={handleSearchTermChange}
            resultCount={totalCount}
            loading={isPending || isFetchingNextPage}
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
              now={now}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              error={error}
              query={searchTerm}
              onFetchNextPage={fetchNextPage}
              firstRequestLoading={false}
            />
          </AnimateChangeInHeight>
        </div>
      </div>
    </div>
  );
}
