import debounce from 'lodash.debounce';
import { useCallback, useEffect, useState } from 'react';

import { CategoryPill } from '@/features/listings/components/CategoryPill';

import { type SearchSkills, skillsData } from '../constants/schema';

interface PillsFilterProps {
  activeSkills: SearchSkills[];
  onSkillsChange: (skills: SearchSkills[]) => void;
  loading?: boolean;
  isLoading?: boolean;
}

export function PillsFilter({
  activeSkills,
  onSkillsChange,
  loading = false,
  isLoading = false,
}: PillsFilterProps) {
  const [localActiveSkills, setLocalActiveSkills] =
    useState<SearchSkills[]>(activeSkills);

  const isDisabled = loading || isLoading;

  useEffect(() => {
    setLocalActiveSkills(activeSkills);
  }, [activeSkills]);

  const debouncedSkillsChange = useCallback(
    debounce((skills: SearchSkills[]) => {
      onSkillsChange(skills);
    }, 500),
    [onSkillsChange],
  );

  const handleSkillToggle = useCallback(
    (skill: SearchSkills) => {
      if (isDisabled) return;

      const newSkills = localActiveSkills.includes(skill)
        ? localActiveSkills.filter((s) => s !== skill)
        : [...localActiveSkills, skill];

      setLocalActiveSkills(newSkills);

      debouncedSkillsChange(newSkills);
    },
    [localActiveSkills, isDisabled, debouncedSkillsChange],
  );

  return (
    <div className="flex flex-wrap gap-2 px-1 py-2 sm:px-4">
      {skillsData.map((skill) => (
        <div
          key={skill.value}
          className={isDisabled ? 'cursor-not-allowed opacity-50' : ''}
        >
          <CategoryPill
            isActive={localActiveSkills.includes(skill.value)}
            onClick={() => !isDisabled && handleSkillToggle(skill.value)}
          >
            {skill.label}
          </CategoryPill>
        </div>
      ))}
    </div>
  );
}
