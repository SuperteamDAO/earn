import { ArrowForwardIcon } from '@chakra-ui/icons';
import { Button, Flex, VStack } from '@chakra-ui/react';
import { type Dispatch, type SetStateAction } from 'react';

import { type Bounty, ListingCard } from '@/features/listings';

import { search } from '../utils';

interface Props {
  results: Bounty[];
  setResults: Dispatch<SetStateAction<Bounty[]>>;
  count: number;
  query: string;
}

export function Results({ results, setResults, count, query }: Props) {
  return (
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
            if (results) {
              const lastId = results[results.length - 1]?.id;
              if (lastId) {
                const nextResults = await search(query, {
                  offset: results.length,
                });
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
  );
}
