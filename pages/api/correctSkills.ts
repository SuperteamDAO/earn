import type { NextApiRequest, NextApiResponse } from 'next';

import {
  type MainSkills,
  type SubSkillsType,
  SkillList,
} from '@/interface/skills';
import { prisma } from '@/prisma';

const uniqueArray = (arr: SubSkillsType[]): SubSkillsType[] => {
  return Array.from(new Set(arr));
};

const correctSkills = (
  skillObjArray: { skills: MainSkills; subskills: SubSkillsType[] }[]
): { skills: MainSkills; subskills: SubSkillsType[] }[] => {
  const correctedSkills: { skills: MainSkills; subskills: SubSkillsType[] }[] =
    [];
  const skillMap: Record<MainSkills, SubSkillsType[]> = {} as Record<
    MainSkills,
    SubSkillsType[]
  >;

  skillObjArray.forEach((skillObj) => {
    skillObj.subskills.forEach((subskill) => {
      const correctMainSkill = SkillList.find((s) =>
        s.subskills.includes(subskill)
      );

      if (correctMainSkill) {
        if (!skillMap[correctMainSkill.mainskill]) {
          skillMap[correctMainSkill.mainskill] = [];
        }
        skillMap[correctMainSkill.mainskill].push(subskill);
      }
    });
  });

  Object.keys(skillMap).forEach((key) => {
    correctedSkills.push({
      skills: key as MainSkills,
      subskills: uniqueArray(skillMap[key as MainSkills]),
    });
  });

  return correctedSkills;
};

export default async function correctAllSkills(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  let updatedCount = 0;

  try {
    const allUsers = await prisma.user.findMany();

    // eslint-disable-next-line no-restricted-syntax
    for (const user of allUsers) {
      const { id, skills: untypedSkills } = user;

      // Cast or convert skills to the expected type here
      const skills: { skills: MainSkills; subskills: SubSkillsType[] }[] =
        typeof untypedSkills === 'string'
          ? JSON.parse(untypedSkills)
          : untypedSkills;

      const correctedSkillsArray = skills ? correctSkills(skills) : [];

      if (JSON.stringify(skills) !== JSON.stringify(correctedSkillsArray)) {
        // eslint-disable-next-line no-plusplus
        updatedCount++;
        // eslint-disable-next-line no-await-in-loop
        await prisma.user.update({
          where: { id },
          data: { skills: correctedSkillsArray },
        });
      }
    }

    return res.status(200).json({
      message: 'Skills correction complete.',
      updatedUsers: updatedCount,
    });
  } catch (e) {
    console.error('Error in correctAllSkills:', e);
    return res.status(500).json({
      message: 'An error occurred while correcting skills for all users.',
    });
  }
}
