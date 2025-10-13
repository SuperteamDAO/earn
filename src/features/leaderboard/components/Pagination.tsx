import debounce from 'lodash.debounce';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils/cn';

interface Props {
  page: number;
  setPage: (value: number) => void;
  count: number;
}

const SIZE = 6;
export function Pagination({ page, setPage, count }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(String(page));
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedHandleClick = useMemo(
    () => debounce((newPage: number) => setPage(newPage), 500),
    [setPage],
  );

  useEffect(() => {
    if (!isEditing) {
      setInputValue(String(page));
    }
  }, [page, isEditing]);

  if (count === 0) return <></>;
  const totalPages = Math.ceil(count / 10);

  const commitInput = () => {
    const numeric = parseInt(inputValue, 10);
    if (Number.isNaN(numeric)) {
      setIsEditing(false);
      setInputValue(String(page));
      return;
    }
    const clamped = Math.max(1, Math.min(totalPages, numeric));
    setIsEditing(false);
    if (clamped !== page) {
      debouncedHandleClick(clamped);
    }
  };

  const renderPageNumbers = () => {
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
        if (i === page && isEditing) {
          pageNumbers.push(
            <Input
              key={`input-${i}`}
              ref={inputRef}
              value={inputValue}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setInputValue(val);
              }}
              onBlur={commitInput}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitInput();
                if (e.key === 'Escape') {
                  setIsEditing(false);
                  setInputValue(String(page));
                }
              }}
              inputMode="numeric"
              pattern="[0-9]*"
              aria-label="Jump to page"
              className={cn(
                `w-[${SIZE * 8}px] h-[${SIZE}] min-w-0 rounded-md px-2 py-2 text-xs`,
                'border-brand-purple text-brand-purple border',
              )}
            />,
          );
        } else {
          pageNumbers.push(
            <Button
              key={i}
              className={cn(
                `w-[${SIZE}] h-[${SIZE}] min-w-0 rounded-md px-4 py-2 text-xs`,
                'border',
                page === i
                  ? 'border-brand-purple text-brand-purple'
                  : 'border-slate-200 text-slate-500',
                i === page && 'active',
              )}
              onClick={() => {
                if (i === page) {
                  setIsEditing(true);
                  // focus after render
                  setTimeout(() => inputRef.current?.focus(), 0);
                } else {
                  debouncedHandleClick(i);
                }
              }}
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
              `w-[${SIZE}] h-[${SIZE}] min-w-0 rounded-md px-1 py-2 text-xs`,
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
    <div className="my-4 flex flex-wrap gap-2">
      <Button
        className={cn(
          `w-[${SIZE}] h-[${SIZE}] min-w-0 rounded-md p-1`,
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
          `w-[${SIZE}] h-[${SIZE}] min-w-0 rounded-md p-1`,
          'disabled:pointer-events-none disabled:border-slate-300 disabled:bg-slate-300 disabled:text-slate-500 disabled:opacity-50',
        )}
        disabled={page === totalPages}
        onClick={() => debouncedHandleClick(page + 1)}
        variant="outline"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>

      {/* Explicit jump-to-page control */}
      <div className="ml-2 flex items-center gap-2">
        <span className="text-xs text-slate-500">Go to</span>
        <Input
          value={inputValue}
          onChange={(e) => {
            const val = e.target.value.replace(/[^0-9]/g, '');
            setInputValue(val);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitInput();
          }}
          inputMode="numeric"
          pattern="[0-9]*"
          aria-label="Go to page"
          placeholder={String(page)}
          className={cn('h-7 w-16 rounded-md px-2 py-1 text-xs')}
        />

        <span className="text-xs text-slate-400">/ {totalPages}</span>
      </div>
    </div>
  );
}
