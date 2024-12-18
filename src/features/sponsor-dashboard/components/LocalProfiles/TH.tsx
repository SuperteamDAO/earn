import { ChevronDown, ChevronUp } from 'lucide-react';
import React, { type ReactNode } from 'react';

import { TableHead } from '@/components/ui/table';
import { cn } from '@/utils/cn';

type SortDirection = 'asc' | 'desc' | null;

interface THProps extends React.HTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
}

export const TH = ({ children, className, ...props }: THProps) => {
  return (
    <TableHead
      className={cn(
        'text-xs font-medium tracking-wider text-slate-500',
        className,
      )}
      {...props}
    >
      {children}
    </TableHead>
  );
};

interface SortableTHProps extends THProps {
  column: string;
  currentSort: { column: string; direction: SortDirection };
  setSort: (column: string, direction: SortDirection) => void;
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
    <TableHead className={className} {...props}>
      <div
        className="flex cursor-pointer items-center gap-0.5"
        onClick={handleSort}
      >
        <span>{children}</span>
        <div className="flex flex-col">
          <ChevronUp
            className={cn(
              'mb-[-4px] h-4 w-4 transition-colors',
              currentSort.column === column && currentSort.direction === 'asc'
                ? 'text-slate-600'
                : 'text-slate-400 hover:text-slate-500',
            )}
          />
          <ChevronDown
            className={cn(
              'h-4 w-4 transition-colors',
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
