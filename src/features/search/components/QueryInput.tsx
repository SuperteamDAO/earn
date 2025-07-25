import { Loader2, Search, Undo2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { easeOutQuad } from '@/utils/easings';

interface SearchButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  resultCount?: number;
  resultsStale?: boolean;
}

export function SearchButton({
  onClick,
  disabled = false,
  loading = false,
  resultCount,
  resultsStale,
}: SearchButtonProps) {
  if (loading)
    return (
      <p className="flex items-center gap-2 pr-2 text-xs text-slate-500">
        Searching for listings
        <Loader2 className="h-4 w-4 animate-spin" />
      </p>
    );
  if (resultCount && !loading && !resultsStale)
    return (
      <p className="pr-2 text-xs text-slate-500">
        Showing {resultCount} results
      </p>
    );
  return (
    <Button
      type="submit"
      onClick={onClick}
      disabled={disabled || loading}
      className={`h-full px-2.5 py-0 text-xs`}
    >
      <span>Search</span>
      <Undo2 className="size-3 rotate-x-180" />
    </Button>
  );
}

interface QueryInputProps {
  query: string;
  onQueryChange: (query: string) => void;
  resultCount?: number;
  loading?: boolean;
}

export function QueryInput({
  query,
  onQueryChange,
  resultCount,
  loading = false,
}: QueryInputProps) {
  const [localQuery, setLocalQuery] = useState(query);

  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (localQuery.trim()) {
      onQueryChange(localQuery.trim());
    }
  };

  const resultsStale = query.trim() !== localQuery.trim();

  return (
    <div className="ph-no-capture w-full px-1 sm:px-4">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <div className="absolute top-1/2 left-[0.0625rem] grid h-[calc(100%-0.125rem)] -translate-y-1/2 items-center rounded-l-lg border-r bg-slate-50 px-2.5">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <Input
            name="query"
            className="ph-no-capture rounded-lg border-slate-200 pr-10 pl-13 text-sm font-normal text-slate-600 md:text-base"
            autoFocus
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder="Search for Superteam Earn Listings"
            value={localQuery}
          />
          <div className="absolute top-1/2 right-1 grid h-[calc(80%-0.125rem)] -translate-y-1/2 place-items-center">
            <AnimatePresence mode="wait">
              <motion.div
                className="flex h-full items-center justify-end"
                key={
                  resultCount && !loading && !resultsStale
                    ? 'results-count'
                    : loading
                      ? 'loading'
                      : 'search-button'
                }
                initial={{ opacity: 0, filter: 'blur(6px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, filter: 'blur(6px)' }}
                transition={{
                  duration: 0.125,
                  ease: easeOutQuad,
                }}
              >
                <SearchButton
                  resultCount={resultCount}
                  loading={loading}
                  resultsStale={resultsStale}
                  disabled={localQuery.trim() === ''}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </form>
    </div>
  );
}
