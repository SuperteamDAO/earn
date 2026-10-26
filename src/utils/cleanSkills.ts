import {
  allSkills,
  type ParentSkills,
  skillSubSkillMap,
  type SubSkillsType,
} from '@/interface/skills';

const uniqueArray = (arr: SubSkillsType[]): SubSkillsType[] => {
  return Array.from(new Set(arr));
};

export const cleanSkills = (
  skillObjArray: { skills: ParentSkills; subskills: SubSkillsType[] }[],
): { skills: ParentSkills; subskills: SubSkillsType[] }[] => {
  // In the order each parent skill first shows up.
  const skillMap = new Map<ParentSkills, SubSkillsType[]>();

  skillObjArray.forEach((skillObj) => {
    if (!skillMap.has(skillObj.skills)) {
      skillMap.set(skillObj.skills, []);
    }
    skillObj.subskills.forEach((subskill) => {
      const correctMainSkill = allSkills.find((mainSkill) =>
        skillSubSkillMap[mainSkill].some(
          (subSkillObj) => subSkillObj.value === subskill,
        ),
      );

      if (correctMainSkill) {
        const subskills = skillMap.get(correctMainSkill) ?? [];
        subskills.push(subskill);
        skillMap.set(correctMainSkill, subskills);
      }
    });
  });

  return Array.from(skillMap, ([skills, subskills]) => ({
    skills,
    subskills: uniqueArray(subskills),
  }));
};
