import { type GetServerSideProps } from 'next';

import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';

import { PillsFilter } from '@/features/search/components/PillsFilter';
import { QueryInput } from '@/features/search/components/QueryInput';
import { Results } from '@/features/search/components/Results';
import { useSearchListings } from '@/features/search/hooks/useSearchListings';
import { useSearchState } from '@/features/search/hooks/useSearchState';

interface NewSearchProps {
  initialQuery?: string;
}

const NewSearch = ({ initialQuery = '' }: NewSearchProps) => {
  const {
    searchTerm,
    activeStatus,
    activeSkills,
    handleSearchTermChange,
    handleToggleSkill,
  } = useSearchState({
    defaultSearchTerm: initialQuery,
  });

  // Get the total count for display in QueryInput
  const { data, isLoading } = useSearchListings({
    query: searchTerm,
    status: activeStatus,
    skills: activeSkills,
    bountiesLimit: 10,
    grantsLimit: 3,
  });

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
              loading={isLoading}
            />

            <div className="mt-4 w-full">
              <div className="flex items-center justify-between">
                <div className="hidden md:flex">
                  <PillsFilter
                    activeSkills={activeSkills}
                    onSkillToggle={handleToggleSkill}
                    loading={isLoading}
                  />
                </div>
                <div className="ml-auto">
                  {/* TODO: Add DropdownFilter here */}
                </div>
              </div>
            </div>

            {/* Debug Info */}
            <div className="mt-2 w-full">
              <div className="text-xs text-slate-400">
                <p>Active Status: {activeStatus.join(', ') || 'None'}</p>
                <p>Active Skills: {activeSkills.join(', ') || 'None'}</p>
              </div>
            </div>

            <div className="mx-3 h-[1px] bg-slate-200 md:mx-4" />

            {/* Results Component handles everything */}
            <Results
              query={searchTerm}
              status={activeStatus}
              skills={activeSkills}
              bountiesLimit={10}
              grantsLimit={3}
            />
          </div>
        </div>
      </div>
    </Default>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const query = (context.query.q as string) || '';

  return {
    props: {
      initialQuery: query.trim(),
    },
  };
};

export default NewSearch;
