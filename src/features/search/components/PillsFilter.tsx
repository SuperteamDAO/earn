import { CategoryPill } from '@/features/listings/components/CategoryPill';

import type { SearchSkills } from '../constants/schema';

interface PillsFilterProps {
  activeSkills: SearchSkills[];
  onSkillToggle: (skill: SearchSkills) => void;
  loading?: boolean;
}

const skillsData: Array<{ label: string; value: SearchSkills }> = [
  { label: 'Content', value: 'CONTENT' },
  { label: 'Design', value: 'DESIGN' },
  { label: 'Development', value: 'DEVELOPMENT' },
  { label: 'Others', value: 'OTHER' },
];

export function PillsFilter({
  activeSkills,
  onSkillToggle,
  loading = false,
}: PillsFilterProps) {
  return (
    <div className="flex flex-wrap gap-2 px-1 py-2 sm:px-4">
      {skillsData.map((skill) => (
        <CategoryPill
          key={skill.value}
          isActive={activeSkills.includes(skill.value)}
          onClick={() => !loading && onSkillToggle(skill.value)}
        >
          {skill.label}
        </CategoryPill>
      ))}
    </div>
  );
}
