import { Regions } from '@prisma/client';
import debounce from 'lodash.debounce';
import { type GetServerSideProps } from 'next';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import { getServerSession } from 'next-auth';
import { usePostHog } from 'posthog-js/react';
import { useCallback, useEffect, useState, useTransition } from 'react';

import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { api } from '@/lib/api';
import { prisma } from '@/prisma';
import { getURL } from '@/utils/validUrl';

import {
  filterRegionCountry,
  getCombinedRegion,
} from '@/features/listings/utils/region';
import { Filters } from '@/features/search/components/Filters';
import { Info } from '@/features/search/components/Info';
import { QueryInput } from '@/features/search/components/QueryInput';
import { Results } from '@/features/search/components/Results';
import { type SearchResult } from '@/features/search/types';
import {
  preSkillFilters,
  preStatusFilters,
} from '@/features/search/utils/filters';
import { serverSearch } from '@/features/search/utils/search';
import { updateCheckboxes } from '@/features/search/utils/updateCheckboxes';

import { authOptions } from '../api/auth/[...nextauth]';

interface CheckboxFilter {
  label: string;
  value: string;
  checked: boolean;
}

interface SearchProps {
  statusFilters: CheckboxFilter[];
  skillsFilters: CheckboxFilter[];
  results?: SearchResult[];
  count?: number;
  bountiesCount?: number;
  grantsCount?: number;
}

const Search = ({
  statusFilters,
  skillsFilters,
  results: resultsP,
  count = 0,
  bountiesCount = 0,
  grantsCount = 0,
}: SearchProps) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const posthog = usePostHog();

  const [results, setResults] = useState<SearchResult[]>(resultsP ?? []);
  const [query, setQuery] = useState(searchParams?.get('q') ?? '');
  const [loading, setLoading] = useState(false);

  const debouncedServerSearch = useCallback(debounce(serverSearch, 500), []);

  const handleStart = (url: string) => {
    if (url !== router.asPath) {
      document.body.style.cursor = 'wait';
      setLoading(true);
    }
  };

  const handleComplete = (url: string) => {
    if (url === router.asPath) {
      document.body.style.cursor = 'auto';
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      document.body.style.cursor = 'auto';
      setLoading(false);
    };
  }, []);

  useEffect(() => {
    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router]);

  useEffect(() => {
    debouncedServerSearch(startTransition, router, query);
    setLoading(false);
    return () => {
      debouncedServerSearch.cancel();
    };
  }, [query]);

  useEffect(() => {
    posthog.capture('detailed results_search', {
      query,
      count,
      status: statusFilters.filter((f) => f.checked).map((f) => f.value),
      skills: skillsFilters.filter((f) => f.checked).map((f) => f.value),
    });
  }, []);

  return (
    <Default
      meta={
        <Meta
          title={`Search - ${query} | Superteam Earn`}
          description={`Search Results for ${query}`}
        />
      }
    >
      <div className="min-h-screen w-full bg-white">
        <div className="mx-auto flex w-full max-w-7xl gap-8 px-3 py-4 md:px-4">
          <div className="flex w-full flex-col items-start md:w-[70%]">
            <QueryInput loading={loading} query={query} setQuery={setQuery} />
            <Info loading={loading} count={count} query={query} />
            <div className="w-full md:hidden">
              <Filters
                loading={loading}
                query={query}
                statusFilters={statusFilters}
                skillsFilters={skillsFilters}
              />
            </div>
            <div className="mx-3 h-[1px] bg-slate-200 md:mx-4" />
            <Results
              query={query}
              results={results}
              setResults={setResults}
              count={count}
              grantsCount={grantsCount}
              bountiesCount={bountiesCount}
              status={statusFilters
                .filter((s) => s.checked)
                .map((s) => s.value)
                .join(',')}
              skills={skillsFilters
                .filter((s) => s.checked)
                .map((s) => s.value)
                .join(',')}
            />
          </div>
          <div className="hidden w-full md:block md:w-[30%]">
            <Filters
              query={query}
              loading={loading}
              statusFilters={statusFilters}
              skillsFilters={skillsFilters}
            />
          </div>
        </div>
      </div>
    </Default>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  let userRegion: string[] | null | undefined = null;

  if (session?.user?.id) {
    const user = await prisma.user.findFirst({
      where: { id: session.user.id },
      select: { location: true },
    });

    if (user?.location) {
      const matchedRegion = user.location
        ? getCombinedRegion(user.location, true)
        : undefined;
      if (matchedRegion?.name) {
        userRegion = [
          matchedRegion.name,
          Regions.GLOBAL,
          ...(filterRegionCountry(matchedRegion, user.location || '').country ||
            []),
        ];
      } else {
        userRegion = [Regions.GLOBAL];
      }
    }
  }

  const fullUrl = getURL();
  const queryTerm = (context.query.q as string).trim();

  const status = (context.query.status as string) || undefined;
  const statusFilters = updateCheckboxes(status ?? '', preStatusFilters);

  const skills = (context.query.skills as string) || undefined;
  const skillsFilters = updateCheckboxes(skills ?? '', preSkillFilters);
  try {
    const searchUrl = new URL(
      `${fullUrl}/api/search/${encodeURIComponent(queryTerm)}`,
    );
    searchUrl.search = new URLSearchParams(context.query as any).toString();
    searchUrl.searchParams.set('bountiesLimit', '10');
    searchUrl.searchParams.set('grantsLimit', '3');
    if (userRegion?.length) {
      searchUrl.searchParams.set('userRegion', userRegion.join(','));
    }

    const response = await api.get(searchUrl.toString());
    const results = await response.data;
    return {
      props: {
        statusFilters,
        skillsFilters,
        results: results.results,
        count: results.count,
        bountiesCount: results.bountiesCount,
        grantsCount: results.grantsCount,
        userRegion,
      },
    };
  } catch (e) {
    console.log(e);
    return {
      props: {
        statusFilters,
        skillsFilters,
        userRegion,
      },
    };
  }
};

export default Search;
