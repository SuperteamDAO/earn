import debounce from 'lodash.debounce';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { CategoryPill } from '@/features/listings/components/CategoryPill';

import { type SearchSkills, skillsData } from '../constants/schema';

interface PillsFilterProps {
  activeSkills: SearchSkills[];
  onSkillsChange: (skills: SearchSkills[]) => void;
}

export function PillsFilter({
  activeSkills,
  onSkillsChange,
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
      const newSkills = localActiveSkills.includes(skill)
        ? localActiveSkills.filter((s) => s !== skill)
        : [...localActiveSkills, skill];

      setLocalActiveSkills(newSkills);

      debouncedSkillsChange(newSkills);
    },
    [localActiveSkills, debouncedSkillsChange],
  );

  return (
    <div className="flex flex-wrap gap-2">
      {skillsData.map((skill) => (
        <div key={skill.value}>
          <CategoryPill
            isActive={localActiveSkills.includes(skill.value)}
            onClick={() => handleSkillToggle(skill.value)}
          >
            {skill.label}
          </CategoryPill>
        </div>
      ))}
    </div>
  );
}
