import { ArrowForwardIcon } from '@chakra-ui/icons';
import { Box, Button, Flex, Text, VStack } from '@chakra-ui/react';
import axios from 'axios';
import debounce from 'lodash.debounce';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { type Bounty, ListingCard } from '@/features/listings';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';

const Search = () => {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') ?? '';

  const [results, setResults] = useState<Bounty[]>([]);
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log('results length ', results.length);
    console.log(
      'results  ',
      results.map((r) => r.id),
    );
  }, [results]);
  useEffect(() => {
    console.log('total count', count);
  }, [count]);

  const debouncedSearch = useCallback(
    debounce(async () => {
      const data = await search();
      if (data) {
        setResults(data.bounties);
        setCount(data.count);
        console.log('count', data.count);
      }
    }, 500),
    [query],
  );

  interface SearchQuery {
    offsetId?: string;
    status?: string;
    skills?: string;
    offset?: number;
  }
  async function search(params?: SearchQuery) {
    try {
      if (query.length > 0) {
        const resp = await axios.get(
          `/api/search/${encodeURIComponent(query)}`,
          {
            params: {
              limit: 10,
              ...params,
            },
          },
        );
        return resp.data as { bounties: Bounty[]; count: number };
      } else return undefined;
    } catch (err) {
      console.log('search failed - ', err);
      return undefined;
    }
  }
  useEffect(() => {
    // console.log(query);
    debouncedSearch();
    return () => {
      debouncedSearch.cancel();
    };
  }, [query]);

  return (
    <Default
      meta={
        <Meta
          title={`Search - ${query} | Superteam Earn`}
          description={`Search Results for ${query}`}
        />
      }
    >
      <Box w="full" bg="white">
        <Flex
          w="full"
          maxW={'7xl'}
          mx="auto"
          px={{ base: 3, md: 4 }}
          py={{ base: 4 }}
        >
          <VStack align="start" w="full">
            <Box px={{ base: 1, sm: 4 }} py={4}>
              <Text fontSize="sm" fontWeight={600}>
                Found {count} search results
              </Text>
              <Text color="brand.slate.500" fontSize="sm" fontWeight={500}>
                for {`"${query.trim()}"`}
              </Text>
            </Box>
            {results.length > 0 && (
              <VStack w="full">
                <VStack w="full" py={0}>
                  {results.map((r) => (
                    <Flex key={r.id} justify="space-between" w="full" p={0}>
                      <ListingCard bounty={r} />
                    </Flex>
                  ))}
                </VStack>
                {results.length < count && (
                  <Button
                    gap={2}
                    w="full"
                    fontSize="sm"
                    fontWeight="normal"
                    borderColor="brand.slate.100"
                    borderTop={'1px solid'}
                    onClick={async () => {
                      // console.log('view more')
                      if (results) {
                        const lastId = results[results.length - 1]?.id;
                        console.log('last id - ', lastId);
                        if (lastId) {
                          // console.log('calling search')
                          const nextResults = await search({
                            offset: results.length,
                          });
                          // console.log('next results - ', nextResults)
                          if (nextResults) {
                            setResults((s) => s.concat(nextResults.bounties));
                          }
                        }
                      }
                    }}
                    rounded="none"
                    variant="ghost"
                  >
                    View More <ArrowForwardIcon />
                  </Button>
                )}
              </VStack>
            )}
          </VStack>
        </Flex>
      </Box>
    </Default>
  );
};

export default Search;
