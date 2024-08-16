import { type SKILL } from '../types';

export function getSubskills(
  skillsArray: { skills: string; subskills: string[] }[] | null,
  skillType?: string[],
) {
  if (!skillsArray) return [];
  if (skillType && skillType.length !== 0) {
    const skill = skillsArray.find((item) => skillType.includes(item.skills));
    return skill ? skill.subskills : [];
  } else {
    return skillsArray.reduce((allSubskills: string[], item) => {
      return allSubskills.concat(item.subskills);
    }, []);
  }
}

export const skillCategories: Record<SKILL, string[]> = {
  DEVELOPMENT: ['Frontend', 'Backend', 'Blockchain', 'Mobile'],
  DESIGN: ['Design'],
  CONTENT: ['Content'],
  OTHER: ['Other', 'Growth', 'Community'],
  ALL: [],
};
