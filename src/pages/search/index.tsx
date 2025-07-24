import { type GetServerSideProps } from 'next';

import { AnimateChangeInHeight } from '@/components/shared/AnimateChangeInHeight';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { prisma } from '@/prisma';

import { getPrivyToken } from '@/features/auth/utils/getPrivyToken';
import { DropdownFilter } from '@/features/search/components/DropdownFilter';
import { PillsFilter } from '@/features/search/components/PillsFilter';
import { QueryInput } from '@/features/search/components/QueryInput';
import { Results } from '@/features/search/components/Results';
import type {
  SearchSkills,
  SearchStatus,
} from '@/features/search/constants/schema';
import {
  fetchSearchListings,
  type SearchListingsResponse,
  useSearchListings,
} from '@/features/search/hooks/useSearchListings';
import { useSearchState } from '@/features/search/hooks/useSearchState';
import { getUserRegion } from '@/features/search/utils/userRegionSearch';

interface SearchProps {
  initialQuery?: string;
  initialData?: SearchListingsResponse | null;
  userRegion?: string[] | null;
}

const SearchPage = ({
  initialQuery = '',
  initialData,
  userRegion,
}: SearchProps) => {
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
  } = useSearchListings({
    query: searchTerm,
    status: activeStatus,
    skills: activeSkills,
    bountiesLimit: 10,
    grantsLimit: 3,
    userRegion: userRegion || undefined,
    initialData,
  });

  const allResults = data?.pages.flatMap((page) => page.results) ?? [];
  const totalCount = data?.pages[0]?.count
    ? parseInt(data.pages[0].count, 10)
    : 0;

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
            />

            <div className="mt-4 w-full">
              <div className="flex items-center justify-between">
                <div className="hidden md:flex">
                  <PillsFilter
                    activeSkills={activeSkills}
                    onSkillsChange={handleSkillsChange}
                    loading={isFetching}
                  />
                </div>
                <div className="ml-auto">
                  <DropdownFilter
                    activeStatus={activeStatus}
                    activeSkills={activeSkills}
                    onStatusToggle={handleToggleStatus}
                    onSkillToggle={handleToggleSkill}
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
                loading={allResults.length === 0}
              />
            </AnimateChangeInHeight>
          </div>
        </div>
      </div>
    </Default>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const privyDid = await getPrivyToken(context.req);

  let userRegion: string[] | null = null;

  if (privyDid) {
    const user = await prisma.user.findFirst({
      where: { privyDid },
      select: { location: true },
    });

    userRegion = getUserRegion(user?.location);
  }

  const query = (context.query.q as string)?.trim() || '';

  // Parse status and skills from query params (comma-separated)
  const statusParam = context.query.status as string;
  const status = statusParam ? statusParam.split(',') : [];

  const skillsParam = context.query.skills as string;
  const skills = skillsParam ? skillsParam.split(',') : [];

  // Use same limits as useSearchListings defaults
  const bountiesLimit = 10;
  const grantsLimit = 3;

  // Only fetch if we have a query term
  if (!query) {
    return {
      props: {
        initialQuery: query,
        initialData: null,
        userRegion,
      },
    };
  }

  try {
    const initialData = await fetchSearchListings({
      query,
      status: status as SearchStatus[],
      skills: skills as SearchSkills[],
      bountiesLimit,
      grantsLimit,
      userRegion: userRegion || undefined,
    });

    return {
      props: {
        initialQuery: query,
        initialData,
        userRegion,
      },
    };
  } catch (error) {
    console.error('Server-side search fetch error:', error);
    return {
      props: {
        initialQuery: query,
        initialData: null,
        userRegion,
      },
    };
  }
};

export default SearchPage;
