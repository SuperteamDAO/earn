import { ArrowForwardIcon, SearchIcon } from '@chakra-ui/icons';
import {
  Button,
  Container,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Link,
  Modal,
  ModalContent,
  ModalOverlay,
  Spinner,
  VStack,
} from '@chakra-ui/react';
import axios from 'axios';
import debounce from 'lodash.debounce';
import NextLink from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';

import { GrantsCard } from '@/features/grants';
import { ListingCard } from '@/features/listings';

import { type SearchResult } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: Props) {
  const router = useRouter();
  useEffect(() => {
    router.prefetch('/search');
  }, []);

  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const debouncedSearch = useCallback(debounce(search, 500), []);

  async function search(query: string) {
    try {
      setLoading(true);
      if (query.length > 0) {
        const resp = await axios.get(
          `/api/search/${encodeURIComponent(query)}`,
        );
        setResults(resp.data.results as SearchResult[]);
        router.prefetch(`/search?q=${query}`);
      }
      setLoading(false);
    } catch (err) {
      console.log('search failed - ', err);
      setLoading(false);
      return;
    }
  }
  useEffect(() => {
    debouncedSearch(query);
    return () => {
      debouncedSearch.cancel();
    };
  }, [query]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={{ base: 'sm', sm: 'xl' }}>
      <ModalOverlay backdropFilter="blur(6px)" />
      <ModalContent p={0} border="none">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            router.push(`/search?q=${encodeURIComponent(query)}`);
          }}
        >
          <InputGroup border="none">
            <InputLeftElement color="brand.slate.400" pointerEvents="none">
              <SearchIcon />
            </InputLeftElement>
            <Input
              fontSize={{ base: 'sm', md: 'md' }}
              border="none"
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for Solar Earn Listings"
              value={query}
              variant="filled"
            />
            <InputRightElement color="brand.slate.400">
              {loading ? (
                <Spinner size={'sm'} />
              ) : (
                <button type="submit">
                  <ArrowForwardIcon />
                </button>
              )}
            </InputRightElement>
          </InputGroup>
        </form>
        {query.length > 0 && results.length > 0 && (
          <VStack w="full">
            <VStack w="full" py={0}>
              {results.map((listing) => (
                <Container
                  key={listing.id}
                  justifyContent="space-between"
                  display="flex"
                  w="full"
                  p={0}
                >
                  {listing.searchType === 'listing' && (
                    <ListingCard bounty={listing} />
                  )}
                  {listing.searchType === 'grants' && (
                    <GrantsCard grant={listing} />
                  )}
                </Container>
              ))}
            </VStack>
            <Link
              as={NextLink}
              href={`/search?q=${encodeURIComponent(query)}`}
              style={{ width: '100%' }}
            >
              <Button
                gap={2}
                w="full"
                fontSize="sm"
                fontWeight="normal"
                borderTopWidth={1}
                borderTopColor="brand.slate.100"
                rounded="none"
                variant="ghost"
              >
                View All Results <ArrowForwardIcon />{' '}
              </Button>
            </Link>
          </VStack>
        )}
      </ModalContent>
    </Modal>
  );
}
