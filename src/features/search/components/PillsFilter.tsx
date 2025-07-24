import { CategoryPill } from '@/features/listings/components/CategoryPill';

import type { CheckboxFilter } from '../types';

interface Props {
  skillsFilters: CheckboxFilter[];
  onSkillChange: (value: string) => void;
  loading?: boolean;
}

export function PillsFilter({ skillsFilters, onSkillChange, loading }: Props) {
  return (
    <div className="flex flex-wrap gap-2 px-1 py-2 sm:px-4">
      {skillsFilters.map((filter) => (
        <CategoryPill
          key={filter.value}
          isActive={filter.checked}
          onClick={() => !loading && onSkillChange(filter.value)}
        >
          {filter.label}
        </CategoryPill>
      ))}
    </div>
  );
}
