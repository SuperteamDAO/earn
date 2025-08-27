import { LucideListFilter } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusPill } from '@/components/ui/status-pill';
import { Switch } from '@/components/ui/switch';
import type { GrantTrancheStatus } from '@/prisma/enums';

import { colorMap } from '../../utils/statusColorMap';

interface Props {
  selectedFilters: Set<GrantTrancheStatus>;
  onFilterChange: (filters: Set<GrantTrancheStatus>) => void;
}

const TRANCHE_STATUS_FILTERS: Array<{
  label: string;
  value: GrantTrancheStatus;
}> = [
  { label: 'Pending', value: 'Pending' },
  { label: 'Approved', value: 'Approved' },
  { label: 'Rejected', value: 'Rejected' },
  { label: 'Paid', value: 'Paid' },
];

export const MultiSelectFilter = ({
  selectedFilters,
  onFilterChange,
}: Props) => {
  const hasActiveFilters = selectedFilters.size > 0;

  const toggleFilter = (value: GrantTrancheStatus) => {
    const newFilters = new Set(selectedFilters);
    if (newFilters.has(value)) {
      newFilters.delete(value);
    } else {
      newFilters.add(value);
    }
    onFilterChange(newFilters);
  };

  const getFilterColor = (value: GrantTrancheStatus) => {
    return (
      colorMap[value as keyof typeof colorMap] || {
        bg: 'bg-slate-100',
        color: 'text-slate-600',
        border: 'border-slate-200',
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
        <div className="py-1">
          <DropdownMenuGroup>
            <div className="px-3 py-1 text-xs text-slate-400">Status</div>
            <div className="space-y-1">
              {TRANCHE_STATUS_FILTERS.map((filter) => {
                const isSelected = selectedFilters.has(filter.value);
                const colors = getFilterColor(filter.value);

                return (
                  <label
                    key={filter.value}
                    className="flex cursor-pointer items-center justify-between rounded-md px-3 py-1 hover:bg-slate-100"
                  >
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={isSelected}
                        onCheckedChange={() => toggleFilter(filter.value)}
                        className="data-[state=checked]:bg-brand-purple h-3 w-5.5"
                        thumbClassName="size-2 data-[state=checked]:translate-x-2.5"
                      />
                      <StatusPill
                        className="text-[0.625rem]"
                        color={colors.color}
                        backgroundColor={colors.bg}
                        borderColor={colors.border}
                      >
                        {filter.label}
                      </StatusPill>
                    </div>
                  </label>
                );
              })}
            </div>
          </DropdownMenuGroup>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
