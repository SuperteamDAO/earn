import { LucideListFilter } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { GrantTrancheStatus } from '@/prisma/enums';

import { FilterMenuGroup } from '../FilterMenuGroup';

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
          <FilterMenuGroup
            title="Status"
            listClassName="space-y-1"
            filters={TRANCHE_STATUS_FILTERS}
            selectedFilters={selectedFilters}
            onToggle={toggleFilter}
          />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
