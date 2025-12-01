import debounce from 'lodash.debounce';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

interface Props {
  page: number;
  setPage: (value: number) => void;
  count: number;
}

export function Pagination({ page, setPage, count }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(String(page));
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedHandleClick = useMemo(
    () => debounce((newPage: number) => setPage(newPage), 500),
    [setPage],
  );

  useEffect(() => {
    return () => {
      debouncedHandleClick.cancel();
    };
  }, [debouncedHandleClick]);

  // Sync input value when page prop changes
  useEffect(() => {
    setInputValue(String(page));
  }, [page]);

  // Auto-focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  if (count === 0) return <></>;

  const totalPages = Math.ceil(count / 10);

  const handlePageInputSubmit = () => {
    const newPage = parseInt(inputValue, 10);
    if (!isNaN(newPage)) {
      // Clamp to valid range
      const validPage = Math.min(Math.max(1, newPage), totalPages);
      setPage(validPage);
      setInputValue(String(validPage));
    } else {
      // Reset to current page if invalid
      setInputValue(String(page));
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handlePageInputSubmit();
    } else if (e.key === 'Escape') {
      setInputValue(String(page));
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    handlePageInputSubmit();
  };

  const renderPageNumbers = () => {
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
        const isCurrentPage = page === i;

        // For current page, show editable input or clickable indicator
        if (isCurrentPage) {
          pageNumbers.push(
            isEditing ? (
              <input
                key={i}
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                aria-label={`Enter a page number between 1 and ${totalPages}`}
                className="border-brand-purple text-brand-purple ring-brand-purple/20 h-9 w-12 min-w-0 rounded-md border bg-white px-2 py-2 text-center text-xs ring-2 outline-none"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
              />
            ) : (
              <Button
                key={i}
                className={cn(
                  'h-9 min-w-0 rounded-md px-4 py-2 text-xs',
                  'border-brand-purple text-brand-purple border',
                  'hover:bg-brand-purple/5 cursor-text',
                )}
                onClick={() => setIsEditing(true)}
                variant="outline"
                title="Click to jump to a specific page"
                aria-label={`Current page ${i}. Click to enter a specific page number`}
              >
                <span>{i}</span>
              </Button>
            ),
          );
        } else {
          pageNumbers.push(
            <Button
              key={i}
              className={cn(
                'h-9 min-w-0 rounded-md px-4 py-2 text-xs',
                'border border-slate-200 text-slate-500',
              )}
              onClick={() => debouncedHandleClick(i)}
              variant="outline"
            >
              <span>{i}</span>
            </Button>,
          );
        }
      } else if (i === page - 2 || i === page + 2) {
        pageNumbers.push(
          <Button
            className={cn(
              'h-9 min-w-0 rounded-md px-1 py-2 text-xs',
              'border',
              'disabled:border-slate-200 disabled:text-slate-500',
            )}
            key={i}
            disabled
            variant="outline"
          >
            ...
          </Button>,
        );
      }
    }

    return pageNumbers;
  };

  return (
    <div className="my-4 flex flex-wrap items-center gap-2">
      <Button
        className={cn(
          'h-9 min-w-0 rounded-md p-1',
          'disabled:pointer-events-none disabled:border-slate-300 disabled:bg-slate-300 disabled:text-slate-500 disabled:opacity-50',
        )}
        disabled={page === 1}
        onClick={() => debouncedHandleClick(page - 1)}
        variant="outline"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      {renderPageNumbers()}

      <Button
        className={cn(
          'h-9 min-w-0 rounded-md p-1',
          'disabled:pointer-events-none disabled:border-slate-300 disabled:bg-slate-300 disabled:text-slate-500 disabled:opacity-50',
        )}
        disabled={page === totalPages}
        onClick={() => debouncedHandleClick(page + 1)}
        variant="outline"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>

      <span className="ml-2 text-xs text-slate-500">
        Page {page} of {totalPages}
      </span>
    </div>
  );
}
