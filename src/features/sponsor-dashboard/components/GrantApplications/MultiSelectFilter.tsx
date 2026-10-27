import { LucideListFilter } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { GrantApplicationStatus, SubmissionLabels } from '@/prisma/enums';

import { labelMenuOptionsGrants } from '../../constants';
import { FilterMenuGroup } from '../FilterMenuGroup';

interface Props {
  selectedFilters: Set<GrantApplicationStatus | SubmissionLabels>;
  onFilterChange: (
    filters: Set<GrantApplicationStatus | SubmissionLabels>,
  ) => void;
}

const DECISION_FILTERS: Array<{
  label: string;
  value: GrantApplicationStatus;
}> = [
  { label: 'Pending', value: 'Pending' },
  { label: 'Approved', value: 'Approved' },
  { label: 'Completed', value: 'Completed' },
  { label: 'Rejected', value: 'Rejected' },
];

const LABEL_FILTERS = labelMenuOptionsGrants
  .filter((option) => option.value !== 'Pending')
  .map((option) => ({
    label: option.label,
    value: option.value as SubmissionLabels,
  }));

export const MultiSelectFilter = ({
  selectedFilters,
  onFilterChange,
}: Props) => {
  const hasActiveFilters = selectedFilters.size > 0;

  const toggleFilter = (value: GrantApplicationStatus | SubmissionLabels) => {
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
            title="Decision"
            listClassName="mb-3 space-y-1"
            filters={DECISION_FILTERS}
            selectedFilters={selectedFilters}
            onToggle={toggleFilter}
          />

          <FilterMenuGroup
            title="Label"
            listClassName="space-y-1"
            filters={LABEL_FILTERS}
            selectedFilters={selectedFilters}
            onToggle={toggleFilter}
          />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
