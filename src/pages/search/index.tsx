import { Box, Divider, Flex, VStack } from '@chakra-ui/react';
import debounce from 'lodash.debounce';
import { type GetServerSideProps } from 'next';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import { useCallback, useEffect, useState, useTransition } from 'react';

import { type Bounty } from '@/features/listings';
import {
  Filters,
  Info,
  preSkillFilters,
  preStatusFilters,
  QueryInput,
  Results,
  serverSearch,
  updateCheckboxes,
} from '@/features/search';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { getURL } from '@/utils/validUrl';

interface CheckboxFilter {
  label: string;
  value: string;
  checked: boolean;
}

interface SearchProps {
  statusFilters: CheckboxFilter[];
  skillsFilters: CheckboxFilter[];
  bounties?: Bounty[];
  count?: number;
}

const Search = ({
  statusFilters,
  skillsFilters,
  bounties,
  count = 0,
}: SearchProps) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const posthog = usePostHog();

  const [results, setResults] = useState<Bounty[]>(bounties ?? []);
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
    posthog.capture('search', {
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
      <Box w="full" minH="100vh" bg="white">
        <Flex
          gap={8}
          w="full"
          maxW={'8xl'}
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

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const fullUrl = getURL();

  const queryTerm = (query.q as string).trim();
  const queryString = new URLSearchParams(query as any).toString();

  const status = (query.status as string) || undefined;
  const statusFilters = updateCheckboxes(status ?? '', preStatusFilters);

  const skills = (query.skills as string) || undefined;
  const skillsFilters = updateCheckboxes(skills ?? '', preSkillFilters);

  try {
    const response = await fetch(
      `${fullUrl}/api/search/${encodeURIComponent(queryTerm)}?${queryString}&limit=10`,
    );
    const results = await response.json();

    return {
      props: {
        statusFilters,
        skillsFilters,
        bounties: results.bounties,
        count: results.count,
      },
    };
  } catch (e) {
    console.log(e);
    return {
      props: {
        statusFilters,
        skillsFilters,
      },
    };
  }
};

export default Search;
