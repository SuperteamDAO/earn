import type { MultiSelectOptions } from '@/constants';
import type { MainSkills, Skills, SubSkillsType } from '@/interface/skills';
import { SkillList } from '@/interface/skills';

interface Props {
  skills: MultiSelectOptions[];
  subSkills: MultiSelectOptions[];
}

export const mergeSkills = ({ skills = [], subSkills = [] }: Props): Skills => {
  return skills.map((mainskill) => {
    const main = SkillList.find((skill) => skill.mainskill === mainskill.value);
    const sub: SubSkillsType[] = [];

    subSkills.forEach((subskill) => {
      if (main && main.subskills.includes(subskill.value as SubSkillsType)) {
        sub.push(subskill.value as SubSkillsType);
      }
    });

    return {
      skills: (main?.mainskill ?? '') as MainSkills,
      subskills: sub ?? [],
    };
  });
};
