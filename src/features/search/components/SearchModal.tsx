import debounce from 'lodash.debounce';
import { ArrowRight, Search } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { cn } from '@/utils/cn';

import { GrantsCard } from '@/features/grants/components/GrantsCard';
import { ListingCard } from '@/features/listings/components/ListingCard';

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

  const [query, setQuery] = useState(searchParams?.get('q') ?? '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const debouncedSearch = useCallback(debounce(search, 500), []);

  async function search(query: string) {
    try {
      setLoading(true);
      if (query.length > 0) {
        const resp = await api.get(`/api/search/${encodeURIComponent(query)}`);
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        hideCloseIcon
        className={cn(
          'border-none p-0 backdrop-blur-md sm:max-w-xl',
          'fixed left-1/2 top-20 -translate-x-1/2',
          '!block !translate-y-0',
        )}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            router.push(`/search?q=${encodeURIComponent(query)}`);
          }}
          className="relative"
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            className={cn(
              'border-none bg-slate-100 pl-10 pr-10',
              'text-sm md:text-base',
              'focus-visible:ring-0 focus-visible:ring-offset-0',
            )}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for Superteam Earn Listings"
            value={query}
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
          </button>
        </form>

        {query.length > 0 && results.length > 0 && (
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
              href={`/search?q=${encodeURIComponent(query)}`}
              className="w-full"
            >
              <Button
                variant="ghost"
                className={cn(
                  'w-full gap-2 text-sm font-normal hover:bg-brand-purple hover:text-white',
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
