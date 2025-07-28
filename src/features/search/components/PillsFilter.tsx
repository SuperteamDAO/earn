import debounce from 'lodash.debounce';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { CategoryPill } from '@/features/listings/components/CategoryPill';

import { type SearchSkills, skillsData } from '../constants/schema';

interface PillsFilterProps {
  activeSkills: SearchSkills[];
  onSkillsChange: (skills: SearchSkills[]) => void;
  disabled?: boolean;
}

export function PillsFilter({
  activeSkills,
  onSkillsChange,
  disabled = false,
}: PillsFilterProps) {
  const [localActiveSkills, setLocalActiveSkills] =
    useState<SearchSkills[]>(activeSkills);

  useEffect(() => {
    setLocalActiveSkills(activeSkills);
  }, [activeSkills]);

  const debouncedSkillsChange = useMemo(
    () =>
      debounce((skills: SearchSkills[]) => {
        onSkillsChange(skills);
      }, 500),
    [onSkillsChange],
  );

  useEffect(() => {
    return () => {
      debouncedSkillsChange.cancel();
    };
  }, [debouncedSkillsChange]);

  const handleSkillToggle = useCallback(
    (skill: SearchSkills) => {
      if (disabled) return;

      const newSkills = localActiveSkills.includes(skill)
        ? localActiveSkills.filter((s) => s !== skill)
        : [...localActiveSkills, skill];

      setLocalActiveSkills(newSkills);

      debouncedSkillsChange(newSkills);
    },
    [localActiveSkills, debouncedSkillsChange, disabled],
  );

  return (
    <div className="flex flex-wrap gap-2">
      {skillsData.map((skill) => (
        <div key={skill.value}>
          <CategoryPill
            isActive={localActiveSkills.includes(skill.value)}
            onClick={() => handleSkillToggle(skill.value)}
            disabled={disabled}
          >
            {skill.label}
          </CategoryPill>
        </div>
      ))}
    </div>
  );
}
