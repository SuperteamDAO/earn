import { Loader2, Search, Undo2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils/cn';
import { easeOutQuad } from '@/utils/easings';

interface SearchButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  resultCount?: number;
  resultsStale?: boolean;
  isOutside?: boolean;
}

export function SearchButton({
  onClick,
  disabled = false,
  loading = false,
  resultCount,
  resultsStale,
  isOutside = false,
}: SearchButtonProps) {
  if (loading && !isOutside)
    return (
      <p className="hidden items-center gap-2 pr-2 text-xs text-slate-500 md:flex">
        Searching for listings
        <Loader2 className="h-4 w-4 animate-spin" />
      </p>
    );
  if (resultCount && !loading && !resultsStale && !isOutside)
    return (
      <p className="hidden pr-2 text-xs text-slate-500 md:block">
        Found {resultCount} results
      </p>
    );
  return (
    <Button
      variant={isOutside ? 'outline' : 'default'}
      type="submit"
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(`h-full px-2.5 py-0 text-xs`, isOutside && 'w-16 px-0')}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <span>Search</span>
          <Undo2 className="hidden size-3 rotate-x-180 md:block" />
        </>
      )}
    </Button>
  );
}

interface QueryInputProps {
  query: string;
  onQueryChange: (query: string) => void;
  resultCount?: number;
  loading?: boolean;
  onQueryEmptyChange?: (isEmpty: boolean) => void;
}

export function QueryInput({
  query,
  onQueryChange,
  resultCount,
  loading = false,
  onQueryEmptyChange,
}: QueryInputProps) {
  const [localQuery, setLocalQuery] = useState(query);

  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  useEffect(() => {
    const isQueryEmpty = localQuery.trim() === '';
    onQueryEmptyChange?.(isQueryEmpty);
  }, [query, localQuery, onQueryEmptyChange]);

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
        <div className="flex items-stretch gap-2">
          <div className="relative flex-1">
            <div className="absolute top-1/2 left-[0.0625rem] grid h-[calc(100%-0.125rem)] -translate-y-1/2 items-center rounded-l-lg border-r bg-slate-50 px-2.5">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <Input
              name="query"
              className="ph-no-capture rounded-lg border-slate-200 pr-2 pl-13 text-sm font-normal text-slate-600 placeholder:text-sm md:text-base"
              autoFocus
              onChange={(e) => setLocalQuery(e.target.value)}
              placeholder="Search for Listings"
              value={localQuery}
            />
            <div className="absolute top-1/2 right-1 hidden h-[calc(80%-0.125rem)] -translate-y-1/2 place-items-center md:grid">
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

          <div className="flex items-center md:hidden">
            <SearchButton
              resultCount={resultCount}
              loading={loading}
              resultsStale={resultsStale}
              disabled={localQuery.trim() === ''}
              isOutside
            />
          </div>
        </div>
      </form>
    </div>
  );
}
