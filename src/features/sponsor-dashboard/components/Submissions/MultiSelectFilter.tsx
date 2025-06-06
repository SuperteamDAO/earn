import type { SubmissionLabels } from '@prisma/client';
import { LucideListFilter } from 'lucide-react';
import { useMemo } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/utils/cn';

import { labelMenuOptions } from '../../constants';
import { colorMap } from '../../utils/statusColorMap';

interface Props {
  selectedFilters: Set<SubmissionLabels | 'Winner' | 'Rejected'>;
  onFilterChange: (
    filters: Set<SubmissionLabels | 'Winner' | 'Rejected'>,
  ) => void;
  listingType?: string;
}

const DECISION_FILTERS = [
  { label: 'Winner', value: 'Winner' as const },
  { label: 'Rejected', value: 'Rejected' as const },
  ...labelMenuOptions.map((option) => ({
    label: option.label,
    value: option.value as SubmissionLabels,
  })),
];

export const MultiSelectFilter = ({
  selectedFilters,
  onFilterChange,
  listingType,
}: Props) => {
  const availableFilters = useMemo(() => {
    if (listingType === 'project') {
      return DECISION_FILTERS;
    }
    return DECISION_FILTERS.filter((filter) => filter.value !== 'Rejected');
  }, [listingType]);

  const hasActiveFilters = selectedFilters.size > 0;

  const toggleFilter = (value: SubmissionLabels | 'Winner' | 'Rejected') => {
    const newFilters = new Set(selectedFilters);
    if (newFilters.has(value)) {
      newFilters.delete(value);
    } else {
      newFilters.add(value);
    }
    onFilterChange(newFilters);
  };

  const getFilterColor = (value: SubmissionLabels | 'Winner' | 'Rejected') => {
    if (value === 'Winner') return colorMap.Winner;
    if (value === 'Rejected') return colorMap.Rejected;
    return (
      colorMap[value as keyof typeof colorMap] || {
        bg: 'bg-slate-100',
        color: 'text-slate-600',
      }
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="relative cursor-pointer rounded-md p-1.5 hover:bg-slate-100">
          <LucideListFilter className="size-4 stroke-3 text-slate-600" />
          {hasActiveFilters && (
            <span
              className="absolute right-1.5 bottom-1.5 block size-1 rounded-full bg-green-500 ring-1 ring-white"
              aria-hidden="true"
            />
          )}
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="border-slate-300" align="end">
        <div className="px-3 py-1">
          <DropdownMenuGroup>
            <div className="mb-1 text-xs text-slate-400">Select Options</div>
            <div className="space-y-1">
              {availableFilters.map((filter) => {
                const isSelected = selectedFilters.has(filter.value);
                const colors = getFilterColor(filter.value);

                return (
                  <div
                    key={filter.value}
                    className="flex items-center justify-between py-0.5"
                  >
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={isSelected}
                        onCheckedChange={() => toggleFilter(filter.value)}
                        className="data-[state=checked]:bg-brand-purple h-3 w-5.5"
                        thumbClassName="size-2 data-[state=checked]:translate-x-2.5"
                      />
                      <span
                        className={cn(
                          'w-20 rounded-full border py-0.5 text-center text-[10px] whitespace-nowrap capitalize',
                          colors.bg,
                          colors.color,
                          colors.border,
                        )}
                      >
                        {filter.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </DropdownMenuGroup>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
