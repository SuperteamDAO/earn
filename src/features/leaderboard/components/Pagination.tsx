import debounce from 'lodash.debounce';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useState } from 'react';

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
  const [jumpToPage, setJumpToPage] = useState('');
  const [isJumping, setIsJumping] = useState(false);

  const handleClick = (newPage: number) => {
    setPage(newPage);
  };
  const debouncedHandleClick = useCallback(debounce(handleClick, 500), []);

  const handleJumpToPage = () => {
    const targetPage = parseInt(jumpToPage, 10);
    if (targetPage >= 1 && targetPage <= totalPages) {
      setIsJumping(true);
      setPage(targetPage);
      setJumpToPage('');
      // Reset jumping state after a short delay
      setTimeout(() => setIsJumping(false), 300);
    }
  };

  const handleJumpKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJumpToPage();
    }
  };

  if (count === 0) return <></>;

  const totalPages = Math.ceil(count / 10);

  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 7; // Show more pages for better UX

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
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
            aria-current={page === i ? 'page' : undefined}
            aria-label={`Go to page ${i}`}
            onClick={() => debouncedHandleClick(i)}
            variant="outline"
          >
            <span>{i}</span>
          </Button>,
        );
      }
    } else {
      // Show first page
      pageNumbers.push(
        <Button
          key={1}
          className={cn(
            `w-[${SIZE}] h-[${SIZE}] min-w-0 rounded-md px-4 py-2 text-xs`,
            'border',
            page === 1
              ? 'border-brand-purple text-brand-purple'
              : 'border-slate-200 text-slate-500',
            page === 1 && 'active',
          )}
          aria-current={page === 1 ? 'page' : undefined}
          aria-label={`Go to page 1`}
          onClick={() => debouncedHandleClick(1)}
          variant="outline"
        >
          <span>1</span>
        </Button>,
      );

      // Show ellipsis if needed
      if (page > 4) {
        pageNumbers.push(
          <span
            key="ellipsis1"
            aria-hidden="true"
            className={cn(
              `w-[${SIZE}] h-[${SIZE}] min-w-0 rounded-md px-1 py-2 text-xs`,
              'grid place-items-center border border-slate-200 text-slate-400 select-none',
            )}
          >
            ...
          </span>,
        );
      }

      // Show pages around current page
      const startPage = Math.max(2, page - 1);
      const endPage = Math.min(totalPages - 1, page + 1);

      for (let i = startPage; i <= endPage; i++) {
        if (i !== 1 && i !== totalPages) {
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
              aria-current={page === i ? 'page' : undefined}
              aria-label={`Go to page ${i}`}
              onClick={() => debouncedHandleClick(i)}
              variant="outline"
            >
              <span>{i}</span>
            </Button>,
          );
        }
      }

      // Show ellipsis if needed
      if (page < totalPages - 3) {
        pageNumbers.push(
          <span
            key="ellipsis2"
            aria-hidden="true"
            className={cn(
              `w-[${SIZE}] h-[${SIZE}] min-w-0 rounded-md px-1 py-2 text-xs`,
              'grid place-items-center border border-slate-200 text-slate-400 select-none',
            )}
          >
            ...
          </span>,
        );
      }

      // Show last page
      if (totalPages > 1) {
        pageNumbers.push(
          <Button
            key={totalPages}
            className={cn(
              `w-[${SIZE}] h-[${SIZE}] min-w-0 rounded-md px-4 py-2 text-xs`,
              'border',
              page === totalPages
                ? 'border-brand-purple text-brand-purple'
                : 'border-slate-200 text-slate-500',
              page === totalPages && 'active',
            )}
            aria-current={page === totalPages ? 'page' : undefined}
            aria-label={`Go to page ${totalPages}`}
            onClick={() => debouncedHandleClick(totalPages)}
            variant="outline"
          >
            <span>{totalPages}</span>
          </Button>,
        );
      }
    }

    return pageNumbers;
  };
  return (
    <nav
      className="my-4 flex flex-col gap-4"
      aria-label="Pagination Navigation"
    >
      {/* Main pagination controls */}
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Pagination"
      >
        <Button
          className={cn(
            `w-[${SIZE}] h-[${SIZE}] min-w-0 rounded-md p-1`,
            'disabled:pointer-events-none disabled:border-slate-300 disabled:bg-slate-300 disabled:text-slate-500 disabled:opacity-50',
          )}
          disabled={page === 1}
          aria-disabled={page === 1 || undefined}
          aria-label="Previous page"
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
          aria-disabled={page === totalPages || undefined}
          aria-label="Next page"
          onClick={() => debouncedHandleClick(page + 1)}
          variant="outline"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Jump to page input */}
      {totalPages > 5 && (
        <div
          className="flex items-center gap-2 text-sm text-slate-600"
          aria-label="Jump to page"
        >
          <label htmlFor="jump-to-page" className="sr-only">
            Go to page
          </label>
          <Input
            id="jump-to-page"
            type="number"
            min="1"
            max={totalPages}
            value={jumpToPage}
            onChange={(e) => setJumpToPage(e.target.value)}
            onKeyPress={handleJumpKeyPress}
            placeholder="Page"
            className="h-8 w-20 text-center"
            disabled={isJumping}
          />
          <Button
            onClick={handleJumpToPage}
            disabled={!jumpToPage || isJumping}
            size="sm"
            variant="outline"
            className="h-8 px-3"
          >
            {isJumping ? 'Jumping...' : 'Go'}
          </Button>
          <span className="text-slate-400">of {totalPages}</span>
        </div>
      )}
    </nav>
  );
}
