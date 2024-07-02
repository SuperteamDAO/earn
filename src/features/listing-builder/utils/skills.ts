import { type MultiSelectOptions } from '@/constants';
import {
  type ParentSkills,
  type Skills,
  skillSubSkillMap,
  type SubSkillsType,
} from '@/interface/skills';

interface Props {
  skills: MultiSelectOptions[];
  subskills: MultiSelectOptions[];
}

export const mergeSkills = ({ skills = [], subskills = [] }: Props): Skills => {
  return skills.map((mainskill) => {
    const main =
      skillSubSkillMap[mainskill.value as keyof typeof skillSubSkillMap];
    const sub: SubSkillsType[] = [];

    subskills.forEach((subskill) => {
      if (
        main &&
        main.some((subSkillObj) => subSkillObj.value === subskill.value)
      ) {
        sub.push(subskill.value as SubSkillsType);
      }
    });

    return {
      skills: mainskill.value as ParentSkills,
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
