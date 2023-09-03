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

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // eslint-disable-next-line
  const { id, email, publicKey, skills, ...data } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'User ID is required.' });
  }

  const correctedSkills = correctSkills(skills);

  try {
    const updatedData = {
      ...data,
      skills: correctedSkills,
    };

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updatedData,
      select: {
        email: true,
        publicKey: true,
      },
    });

    return res.json(updatedUser);
  } catch (error: any) {
    console.error('Error updating user profile:', error.message);
    return res.status(500).json({ error: 'Error updating user profile.' });
  }
}
