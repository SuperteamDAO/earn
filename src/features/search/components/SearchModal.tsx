'use client';

import debounce from 'lodash.debounce';
import { ArrowRight, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils/cn';

import { GrantsCard } from '@/features/grants/components/GrantsCard';
import { ListingCard } from '@/features/listings/components/ListingCard';

import { useSearchTypeahead } from '../hooks/use-search-typeahead';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: Props) {
  const router = useRouter();

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

  const { results, isFetching, now } = useSearchTypeahead(debouncedSearchTerm);

  // Makes sure that search page loads instantly and avoids initial flicker
  const prefetchSearchPageData = (query: string) => {
    router.prefetch(`/earn/search/?q=${encodeURIComponent(query)}`);
  };

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
          onSubmit={(e) => {
            e.preventDefault();

            prefetchSearchPageData(inputValue);

            router.push(`/earn/search/?q=${encodeURIComponent(inputValue)}`);
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
                    <ListingCard bounty={listing} now={now} />
                  )}
                  {listing.searchType === 'grants' && (
                    <GrantsCard grant={listing} />
                  )}
                </div>
              ))}
            </div>
            <Link
              href={`/earn/search/?q=${encodeURIComponent(inputValue)}`}
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
