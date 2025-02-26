import debounce from 'lodash.debounce';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

interface Props {
  page: number;
  setPage: (value: number) => void;
  count: number;
}

const SIZE = 6;
export function Pagination({ page, setPage, count }: Props) {
  const handleClick = (newPage: number) => {
    setPage(newPage);
  };
  const debouncedHandleClick = useCallback(debounce(handleClick, 500), []);

  if (count === 0) return <></>;

  const totalPages = Math.ceil(count / 10);

  const renderPageNumbers = () => {
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
        pageNumbers.push(
          <Button
            className={cn(
              `w-[${SIZE}] h-[${SIZE}] min-w-0 rounded-md px-4 py-2 text-xs`,
              'border',
              page === i
                ? 'border-brand-purple text-brand-purple'
                : 'border-slate-200 text-slate-500',
              i === page && 'active',
            )}
            onClick={() => debouncedHandleClick(i)}
            variant="outline"
          >
            <span>{i}</span>
          </Button>,
        );
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
    </div>
  );
}
