import type { MultiSelectOptions } from '@/constants';
import type { MainSkills, Skills, SubSkillsType } from '@/interface/skills';
import { SkillList } from '@/interface/skills';

interface Props {
  skills: MultiSelectOptions[];
  subskills: MultiSelectOptions[];
}

export const mergeSkills = ({ skills = [], subskills = [] }: Props): Skills => {
  return skills.map((mainskill) => {
    const main = SkillList.find((skill) => skill.mainskill === mainskill.value);
    const sub: SubSkillsType[] = [];

    subskills.forEach((subskill) => {
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

export const splitSkills = (skills: Skills): Props => {
  return {
    skills: skills?.map((skill) => ({
      value: skill.skills,
      label: skill.skills,
    })),
    subskills: skills
      ?.map((skill) => {
        return skill?.subskills?.map((subskill) => ({
          value: subskill,
          label: subskill,
        }));
      })
      ?.flat(),
  };
};
