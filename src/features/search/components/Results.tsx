import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { GrantsCard } from '@/features/grants/components/GrantsCard';
import { ListingCard } from '@/features/listings/components/ListingCard';

import type { SearchResult } from '../types';

interface ResultsProps {
  allResults: SearchResult[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  error: unknown;
  query: string;
  onFetchNextPage: () => void;
  loading: boolean;
}

export function Results({
  allResults,
  hasNextPage,
  isFetchingNextPage,
  error,
  query,
  onFetchNextPage,
  loading,
}: ResultsProps) {
  if (loading) return null;
  if (error) {
    return (
      <div className="mt-40 flex flex-col items-center gap-6">
        <p className="text-center text-sm font-semibold text-red-600">
          Error loading search results
        </p>
        <p className="text-center text-sm font-medium text-slate-400">
          Please try again later
        </p>
      </div>
    );
  }

  if (!query) {
    return (
      <div className="mt-40 flex flex-col items-center gap-6">
        <div className="flex flex-col">
          <p className="text-center text-sm font-semibold">
            The search field is empty
          </p>
          <p className="text-center text-sm font-medium text-slate-400">
            Please enter a keyword to search via URL (e.g., ?q=react)
          </p>
        </div>
      </div>
    );
  }

  if (!allResults.length) {
    return (
      <div className="mt-40 flex flex-col items-center gap-6">
        <div className="flex h-32 w-32 items-center justify-center rounded-full bg-slate-100 p-8">
          <svg
            width="43"
            height="43"
            viewBox="0 0 43 43"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M38.9167 42.125L24.4792 27.6875C23.3333 28.6042 22.0156 29.3299 20.526 29.8646C19.0365 30.3993 17.4514 30.6667 15.7708 30.6667C11.6076 30.6667 8.08458 29.2244 5.20167 26.34C2.31875 23.4556 0.876529 19.9325 0.875001 15.7708C0.873473 11.6092 2.3157 8.08611 5.20167 5.20167C8.08764 2.31722 11.6107 0.875 15.7708 0.875C19.931 0.875 23.4548 2.31722 26.3423 5.20167C29.2298 8.08611 30.6713 11.6092 30.6667 15.7708C30.6667 17.4514 30.3993 19.0365 29.8646 20.526C29.3299 22.0156 28.6042 23.3333 27.6875 24.4792L42.125 38.9167L38.9167 42.125ZM15.7708 26.0833C18.6354 26.0833 21.0707 25.0811 23.0767 23.0767C25.0826 21.0722 26.0849 18.6369 26.0833 15.7708C26.0818 12.9047 25.0796 10.4702 23.0767 8.46729C21.0738 6.46438 18.6385 5.46139 15.7708 5.45833C12.9032 5.45528 10.4687 6.45826 8.46729 8.46729C6.4659 10.4763 5.46292 12.9108 5.45833 15.7708C5.45375 18.6308 6.45674 21.0661 8.46729 23.0767C10.4778 25.0872 12.9124 26.0894 15.7708 26.0833Z"
              fill="#94A3B8"
            />
          </svg>
        </div>
        <div className="flex flex-col">
          <p className="text-center text-sm font-semibold">
            We couldn&apos;t find anything for that keyword
          </p>
          <p className="text-center text-sm font-medium text-slate-400">
            Try searching for something else
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col">
      <div className="flex w-full flex-col gap-2">
        {allResults.map((result) => (
          <div className="flex w-full justify-between" key={result.id}>
            {result.searchType === 'listing' && <ListingCard bounty={result} />}
            {result.searchType === 'grants' && <GrantsCard grant={result} />}
          </div>
        ))}
      </div>
      {hasNextPage && (
        <Button
          className="w-full gap-2 rounded-none text-sm font-semibold text-slate-400"
          variant="ghost"
          onClick={onFetchNextPage}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? (
            <span className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"></div>
              Loading...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              View More <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </Button>
      )}
    </div>
  );
}
