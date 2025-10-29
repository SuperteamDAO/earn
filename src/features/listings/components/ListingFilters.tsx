import { LucideListFilter } from 'lucide-react';
import posthog from 'posthog-js';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/utils/cn';

import {
  ALL_FILTER_OPTION,
  LISTING_FILTER_OPTIONS,
} from '../constants/LISTING_FILTER_OPTIONS';
import { getListingSortOptions } from '../constants/SORT_OPTIONS';
import type {
  ListingSortOption,
  ListingStatus,
  OrderDirection,
} from '../hooks/useListings';

interface ListingFiltersProps {
  activeStatus: ListingStatus;
  activeSortBy: ListingSortOption;
  activeOrder: OrderDirection;
  onStatusChange: (status: ListingStatus) => void;
  onSortChange: (sortBy: ListingSortOption, order: OrderDirection) => void;
  showAllFilter?: boolean;
  showStatusSort?: boolean;
}

export const ListingFilters = ({
  activeStatus,
  activeSortBy,
  activeOrder,
  onStatusChange,
  onSortChange,
  showAllFilter = false,
  showStatusSort = false,
}: ListingFiltersProps) => {
  const sortOptions = getListingSortOptions(activeStatus, showStatusSort);

  const isDefaultFilterApplied =
    ((activeStatus === 'open' || (activeStatus === 'all' && showAllFilter)) &&
      activeSortBy === 'Date' &&
      activeOrder === 'asc') ||
    (showStatusSort &&
      activeStatus === 'all' &&
      activeSortBy === 'Status' &&
      activeOrder === 'asc');

  const filterOptions = showAllFilter
    ? [ALL_FILTER_OPTION, ...LISTING_FILTER_OPTIONS]
    : LISTING_FILTER_OPTIONS;

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) {
          posthog.capture('open_listing filters');
        }
      }}
    >
      <DropdownMenuTrigger>
        <div className="relative flex cursor-pointer items-center gap-1.5 rounded-md p-2 hover:bg-slate-100 sm:p-1.5">
          <span className="hidden text-[0.8rem] font-semibold text-slate-500 sm:flex">
            Filter
          </span>
          <LucideListFilter className="size-4 stroke-3 text-slate-600" />
          {!isDefaultFilterApplied && (
            <span
              className="absolute right-2 bottom-2 block size-1 rounded-full bg-green-500 ring-1 ring-white"
              aria-hidden="true"
            />
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-[60]">
        <DropdownMenuLabel className="font-medium text-slate-600">
          Filter By
        </DropdownMenuLabel>
        {filterOptions.map((option) => (
          <DropdownMenuItem
            key={option.label}
            onSelect={() => onStatusChange(option.params.status)}
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
        {sortOptions.map((option) => (
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
