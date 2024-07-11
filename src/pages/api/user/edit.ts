import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import {
  type MainSkills,
  SkillList,
  type SubSkillsType,
} from '@/interface/skills';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

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

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;
  logger.info(
    `Handling request for user ID: ${userId} - ${safeStringify(req.body)}`,
  );

  // eslint-disable-next-line
  const {role, skills, currentSponsorId, generateTalentEmailSettings, totalEarnedInUSD, Hackathon, hackathonId, email, stRecommended, ...data} = req.body;

  const correctedSkills = correctSkills(skills);
  logger.info(`Corrected skills: ${safeStringify(correctedSkills)}`);

  try {
    const updatedData = {
      ...data,
      skills: correctedSkills,
    };
    logger.debug(`Updated data to be saved: ${safeStringify(updatedData)}`);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updatedData,
      select: {
        email: true,
        publicKey: true,
      },
    });

    logger.info(
      `User profile updated successfully: ${safeStringify(updatedUser)}`,
    );
    return res.json(updatedUser);
  } catch (error: any) {
    logger.error(`Error updating user profile: ${safeStringify(error)}`);
    return res.status(500).json({ error: 'Error updating user profile.' });
  }
}

export default withAuth(handler);
