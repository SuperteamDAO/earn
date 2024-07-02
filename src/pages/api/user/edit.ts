import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import {
  type ParentSkills,
  skillSubSkillMap,
  type SubSkillsType,
} from '@/interface/skills';
import { prisma } from '@/prisma';

const uniqueArray = (arr: SubSkillsType[]): SubSkillsType[] => {
  return Array.from(new Set(arr));
};

const correctSkills = (
  skillObjArray: { skills: ParentSkills; subskills: SubSkillsType[] }[],
): { skills: ParentSkills; subskills: SubSkillsType[] }[] => {
  const correctedSkills: {
    skills: ParentSkills;
    subskills: SubSkillsType[];
  }[] = [];
  const skillMap: Record<ParentSkills, SubSkillsType[]> = {} as Record<
    ParentSkills,
    SubSkillsType[]
  >;

  skillObjArray.forEach((skillObj) => {
    if (!skillMap[skillObj.skills]) {
      skillMap[skillObj.skills] = [];
    }
    skillObj.subskills.forEach((subskill) => {
      const correctMainSkill = Object.keys(skillSubSkillMap).find((mainSkill) =>
        skillSubSkillMap[mainSkill as ParentSkills].some(
          (subSkillObj) => subSkillObj.value === subskill,
        ),
      );

      if (correctMainSkill) {
        skillMap[correctMainSkill as ParentSkills].push(subskill);
      }
    });
  });

  Object.keys(skillMap).forEach((key) => {
    correctedSkills.push({
      skills: key as ParentSkills,
      subskills: uniqueArray(skillMap[key as ParentSkills]),
    });
  });

  return correctedSkills;
};

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;

  // eslint-disable-next-line
  const { email, publicKey, skills, role, Hackathon, ...data } = req.body;

  const correctedSkills = correctSkills(skills);

  try {
    const updatedData = {
      ...data,
      skills: correctedSkills,
    };

    const updatedUser = await prisma.user.update({
      where: { id: userId },
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

export default withAuth(handler);
