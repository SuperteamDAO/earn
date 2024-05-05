export * from './dates';

export function getSubskills(
  skillsArray: { skills: string; subskills: string[] }[],
  skillType?: string,
) {
  if (skillType && skillType !== 'ALL') {
    const skill = skillsArray.find((item) => item.skills === skillType);
    return skill ? skill.subskills : [];
  } else {
    return skillsArray.reduce((allSubskills: string[], item) => {
      return allSubskills.concat(item.subskills);
    }, []);
  }
}
