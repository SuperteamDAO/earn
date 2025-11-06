import { LucideListFilter } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/utils/cn';

import { LISTING_FILTER_OPTIONS } from '../../listings/constants/LISTING_FILTER_OPTIONS';
import { HACKATHON_SORT_OPTIONS } from '../../listings/constants/SORT_OPTIONS';
import {
  type HackathonOrderDirection,
  type HackathonSortOption,
  type HackathonStatus,
} from '../hooks/useHackathons';

interface HackathonFiltersProps {
  activeStatus: HackathonStatus;
  activeSortBy: HackathonSortOption;
  activeOrder: HackathonOrderDirection;
  onStatusChange: (status: HackathonStatus) => void;
  onSortChange: (
    sortBy: HackathonSortOption,
    order: HackathonOrderDirection,
  ) => void;
}

export const HackathonFilters = ({
  activeStatus,
  activeSortBy,
  activeOrder,
  onStatusChange,
  onSortChange,
}: HackathonFiltersProps) => {
  const hackathonFilterOptions = LISTING_FILTER_OPTIONS.filter(
    (option) => option.params.status !== 'all',
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div className="cursor-pointer rounded-md p-2 hover:bg-slate-100">
          <LucideListFilter className="size-4 stroke-3 text-slate-600" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="font-medium text-slate-600">
          Filter By
        </DropdownMenuLabel>
        {hackathonFilterOptions.map((option) => (
          <DropdownMenuItem
            key={option.label}
            onSelect={() =>
              onStatusChange(option.params.status as HackathonStatus)
            }
            className={cn(
              'flex items-center gap-2 text-slate-600',
              activeStatus === option.params.status &&
                'bg-slate-100 font-medium',
            )}
          >
            <div
              className={cn(
                'flex size-4 items-center justify-center rounded-full border-[1.5px]',
                option.circleClasses.border,
              )}
            >
              <div
                className={cn('size-2 rounded-full', option.circleClasses.bg)}
              />
            </div>
            {option.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="font-medium text-slate-600">
          Sort By
        </DropdownMenuLabel>
        {HACKATHON_SORT_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.label}
            onSelect={() =>
              onSortChange(option.params.sortBy, option.params.order)
            }
            className={cn(
              'flex gap-2 text-slate-600',
              activeSortBy === option.params.sortBy &&
                activeOrder === option.params.order &&
                'bg-slate-100 font-medium',
            )}
          >
            <div className="text-slate-500">{option.icon}</div>
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
