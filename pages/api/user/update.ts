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
    if (!skillMap[skillObj.skills]) {
      skillMap[skillObj.skills] = [];
    }
    skillObj.subskills.forEach((subskill) => {
      const correctMainSkill = SkillList.find((s) =>
        s.subskills.includes(subskill)
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

export default async function user(req: NextApiRequest, res: NextApiResponse) {
  const { id, addUserSponsor, memberType, skills, ...updateAttributes } =
    req.body;
  let result;
  const correctedSkills = skills ? correctSkills(skills) : [];
  try {
    const updatedData = {
      ...updateAttributes,
      skills: correctedSkills,
    };

    result = await prisma.user.update({
      where: {
        id,
      },
      data: updatedData,
      include: {
        currentSponsor: true,
      },
    });

    if (addUserSponsor && updateAttributes?.currentSponsorId) {
      await prisma.userSponsors.create({
        data: {
          userId: id,
          sponsorId: updateAttributes?.currentSponsorId,
          role: memberType,
        },
      });
    }
    res.status(200).json(result);
  } catch (e) {
    console.log('file: update.ts:29 ~ user ~ e:', e);
    res.status(400).json({
      message: `Error occurred while updating user ${id}.`,
    });
  }
}
