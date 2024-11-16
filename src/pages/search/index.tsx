import { Box, Divider, Flex, VStack } from '@chakra-ui/react';
import { Regions } from '@prisma/client';
import debounce from 'lodash.debounce';
import { type GetServerSideProps } from 'next';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import { getServerSession } from 'next-auth';
import { usePostHog } from 'posthog-js/react';
import { useCallback, useEffect, useState, useTransition } from 'react';

import { CombinedRegions } from '@/constants/Superteam';
import {
  Filters,
  Info,
  preSkillFilters,
  preStatusFilters,
  QueryInput,
  Results,
  type SearchResult,
  serverSearch,
  updateCheckboxes,
} from '@/features/search';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { prisma } from '@/prisma';
import { getURL } from '@/utils/validUrl';

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
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
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
          title={`Search - ${query} | Solar Earn`}
          description={`Search Results for ${query}`}
        />
      }
    >
      <Box w="full" minH="100vh" bg="white">
        <Flex
          gap={8}
          w="full"
          maxW={'7xl'}
          mx="auto"
          px={{ base: 3, md: 4 }}
          py={{ base: 4 }}
        >
          <VStack align="start" w={{ base: 'full', md: '70%' }}>
            <QueryInput loading={loading} query={query} setQuery={setQuery} />
            <Info loading={loading} count={count} query={query} />
            <Box display={{ md: 'none' }} w="full">
              <Filters
                loading={loading}
                query={query}
                statusFilters={statusFilters}
                skillsFilters={skillsFilters}
              />
            </Box>
            <Divider mx={{ base: 3, md: 4 }} />
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
          </VStack>
          <Box
            display={{ base: 'none', md: 'block' }}
            w={{ base: 'full', md: '30%' }}
          >
            <Filters
              query={query}
              loading={loading}
              statusFilters={statusFilters}
              skillsFilters={skillsFilters}
            />
          </Box>
        </Flex>
      </Box>
    </Default>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  let userRegion: Regions[] | null | undefined = null;

  if (session?.user?.id) {
    const user = await prisma.user.findFirst({
      where: { id: session.user.id },
      select: { location: true },
    });

    const matchedRegion = CombinedRegions.find((region) =>
      region.country.includes(user?.location!),
    );

    if (matchedRegion?.region) {
      userRegion = [matchedRegion.region, Regions.GLOBAL];
    } else {
      userRegion = [Regions.GLOBAL];
    }
  }

  const fullUrl = getURL();
  const queryTerm = (context.query.q as string).trim();
  const queryString = new URLSearchParams(context.query as any).toString();

  const status = (context.query.status as string) || undefined;
  const statusFilters = updateCheckboxes(status ?? '', preStatusFilters);

  const skills = (context.query.skills as string) || undefined;
  const skillsFilters = updateCheckboxes(skills ?? '', preSkillFilters);

  try {
    const response = await fetch(
      `${fullUrl}/api/search/${encodeURIComponent(queryTerm)}?${queryString}&bountiesLimit=10&grantsLimit=3${userRegion ? `&userRegion=${userRegion}` : ''}`,
    );
    const results = await response.json();

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
