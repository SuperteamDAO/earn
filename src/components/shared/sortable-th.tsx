import { ChevronDown, ChevronUp } from 'lucide-react';
import React, { type ReactNode } from 'react';

import { TableHead } from '@/components/ui/table';
import { cn } from '@/utils/cn';

type SortDirection = 'asc' | 'desc' | null;

interface SortableTHProps extends React.HTMLAttributes<HTMLTableCellElement> {
  column: string;
  currentSort: { column: string; direction: SortDirection };
  setSort: (column: string, direction: SortDirection) => void;
  children: ReactNode;
}

export const SortableTH = ({
  children,
  column,
  currentSort,
  setSort,
  className,
  ...props
}: SortableTHProps) => {
  const handleSort = () => {
    if (currentSort.column !== column) {
      setSort(column, 'asc');
    } else {
      setSort(column, currentSort.direction === 'asc' ? 'desc' : 'asc');
    }
  };

  return (
    <TableHead className={cn(className)} {...props}>
      <div
        className="flex cursor-pointer items-center gap-0.5"
        onClick={handleSort}
      >
        <span className="whitespace-nowrap">{children}</span>
        <div className="flex flex-col">
          <ChevronUp
            className={cn(
              'mb-[-4px] h-3 w-3 transition-colors',
              currentSort.column === column && currentSort.direction === 'asc'
                ? 'text-slate-600'
                : 'text-slate-400 hover:text-slate-500',
            )}
          />
          <ChevronDown
            className={cn(
              'h-3 w-3 transition-colors',
              currentSort.column === column && currentSort.direction === 'desc'
                ? 'text-slate-700'
                : 'text-slate-400 hover:text-slate-500',
            )}
          />
        </div>
      </div>
    </TableHead>
  );
};
