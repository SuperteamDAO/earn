import { useQueryClient } from '@tanstack/react-query';
import debounce from 'lodash.debounce';
import { ArrowRight, Search } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';

import { GrantsCard } from '@/features/grants/components/GrantsCard';
import { ListingCard } from '@/features/listings/components/ListingCard';

import {
  fetchSearchListings,
  useSearchListings,
} from '../hooks/useSearchListings';
import { type SearchResult } from '../types';
import { getUserRegion } from '../utils/userRegionSearch';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { user } = useUser();

  const userRegion = useMemo(() => {
    if (!user) return null;
    return getUserRegion(user.location);
  }, [user]);

  const searchParams = useSearchParams();

  const [inputValue, setInputValue] = useState(searchParams?.get('q') ?? '');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(
    searchParams?.get('q') ?? '',
  );

  const debouncedSetSearchTerm = useMemo(
    () =>
      debounce((value: string) => {
        setDebouncedSearchTerm(value);
      }, 500),
    [setDebouncedSearchTerm],
  );

  useEffect(() => {
    debouncedSetSearchTerm(inputValue);
    return () => {
      debouncedSetSearchTerm.cancel();
    };
  }, [inputValue, debouncedSetSearchTerm]);

  const { data, isFetching } = useSearchListings({
    query: debouncedSearchTerm,
    status: [],
    skills: [],
    bountiesLimit: 5,
    grantsLimit: 2,
    userRegion: userRegion || undefined,
  });

  const results: SearchResult[] = useMemo(() => {
    return data?.pages.flatMap((page) => page.results) ?? [];
  }, [data]);

  // Makes sure that search page loads instantly and avoids initial flicker
  const prefetchSearchPageData = useCallback(
    (query: string) => {
      router.prefetch(`/search?q=${encodeURIComponent(query)}`);
      if (query.trim()) {
        queryClient.prefetchInfiniteQuery({
          queryKey: [
            'search-listings',
            query.trim(),
            [],
            [],
            10,
            3,
            userRegion,
          ],
          queryFn: ({ pageParam = { bountiesOffset: 0, grantsOffset: 0 } }) =>
            fetchSearchListings({
              query: query.trim(),
              status: [],
              skills: [],
              bountiesLimit: 10,
              grantsLimit: 3,
              userRegion: userRegion || undefined,
              bountiesOffset: pageParam.bountiesOffset,
              grantsOffset: pageParam.grantsOffset,
            }),
          initialPageParam: { bountiesOffset: 0, grantsOffset: 0 },
        });
      }
    },
    [queryClient, userRegion, router],
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        hideCloseIcon
        className={cn(
          'border-none p-0 backdrop-blur-md sm:max-w-xl',
          'fixed top-20 left-1/2 -translate-x-1/2',
          'block! translate-y-0!',
        )}
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();

            prefetchSearchPageData(inputValue);

            router.push(`/search?q=${encodeURIComponent(inputValue)}`);
          }}
          className="relative"
        >
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            className={cn(
              'border-none bg-slate-100 pr-10 pl-10',
              'text-sm md:text-base',
              'focus-visible:ring-0 focus-visible:ring-offset-0',
            )}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Search for Listings"
            value={inputValue}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            autoCorrect="off"
          />
          <button
            type="submit"
            className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400"
          >
            {isFetching ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
          </button>
        </form>

        {debouncedSearchTerm.length > 0 && results.length > 0 && (
          <div className="flex w-full flex-col">
            <div className="flex w-full flex-col py-0">
              {results.map((listing) => (
                <div
                  key={listing.id}
                  className="flex w-full justify-between p-0"
                >
                  {listing.searchType === 'listing' && (
                    <ListingCard bounty={listing} />
                  )}
                  {listing.searchType === 'grants' && (
                    <GrantsCard grant={listing} />
                  )}
                </div>
              ))}
            </div>
            <Link
              href={`/search?q=${encodeURIComponent(inputValue)}`}
              className="w-full"
              onClick={() => prefetchSearchPageData(inputValue)}
            >
              <Button
                variant="ghost"
                className={cn(
                  'hover:bg-brand-purple w-full gap-2 text-sm font-normal hover:text-white',
                  'rounded-none border-t border-slate-100',
                )}
              >
                View All Results <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
