import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

import {
  type MainSkills,
  SkillList,
  type SubSkillsType,
} from '@/interface/skills';
import { prisma } from '@/prisma';

const uniqueArray = (arr: SubSkillsType[]): SubSkillsType[] => {
  return Array.from(new Set(arr));
};

const correctSkills = (
  skillObjArray: { skills: MainSkills; subskills: SubSkillsType[] }[],
): { skills: MainSkills; subskills: SubSkillsType[] }[] => {
  const correctedSkills: { skills: MainSkills; subskills: SubSkillsType[] }[] =
    [];
  const skillMap: Record<MainSkills, SubSkillsType[]> = {} as Record<
    MainSkills,
    SubSkillsType[]
  >;

  skillObjArray.forEach((skillObj) => {
    if (!skillMap[skillObj.skills]) {
      skillMap[skillObj.skills] = [];
    }
    skillObj.subskills.forEach((subskill) => {
      const correctMainSkill = SkillList.find((s) =>
        s.subskills.includes(subskill),
      );

      if (correctMainSkill) {
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
  res: NextApiResponse,
) {
  const token = await getToken({ req });

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = token;

  if (!id) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  // eslint-disable-next-line
  const { email, publicKey, skills, role,...data } = req.body;

  const correctedSkills = correctSkills(skills);

  try {
    const updatedData = {
      ...data,
      skills: correctedSkills,
    };

    const updatedUser = await prisma.user.update({
      where: { id: id as string },
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
