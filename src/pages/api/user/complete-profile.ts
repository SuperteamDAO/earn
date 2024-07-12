import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import {
  type ParentSkills,
  skillSubSkillMap,
  type SubSkillsType,
} from '@/interface/skills';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

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

  logger.debug(`Request body: ${safeStringify(req.body)}`);

  const {
    firstName,
    lastName,
    username,
    location,
    photo,
    bio,
    experience,
    cryptoExperience,
    currentEmployer,
    community,
    workPrefernce,
    isPrivate,
    discord,
    twitter,
    github,
    linkedin,
    telegram,
    website,
    skills,
  } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId as string },
    });

    if (!user) {
      logger.warn(`User not found for user ID: ${userId}`);
      return res.status(404).json({ error: 'User not found' });
    }

    const correctedSkills = correctSkills(skills);

    const data = {
      firstName,
      lastName,
      username,
      location,
      photo,
      bio,
      experience,
      cryptoExperience,
      currentEmployer,
      community,
      workPrefernce,
      private: isPrivate,
      discord,
      twitter,
      github,
      linkedin,
      telegram,
      website,
      skills: correctedSkills,
      superTeamLevel: 'Lurker',
      isTalentFilled: true,
    };

    const categories = new Set([
      'createListing',
      'scoutInvite',
      'commentOrLikeSubmission',
      'weeklyListingRoundup',
      'replyOrTagComment',
      'productAndNewsletter',
    ]);

    for (const category of categories) {
      await prisma.emailSettings.create({
        data: {
          user: { connect: { id: userId as string } },
          category: category as string,
        },
      });
    }

    logger.info(`Completing user profile with data: ${safeStringify(data)}`);

    await prisma.user.updateMany({
      where: {
        id: userId as string,
      },
      data,
    });

    const result = await prisma.user.findUnique({
      where: { id: userId as string },
      include: {
        currentSponsor: true,
        UserSponsors: true,
        Hackathon: true,
        Submission: true,
        emailSettings: true,
      },
    });

    logger.info(`User onboarded successfully for user ID: ${userId}`);
    return res.status(200).json(result);
  } catch (error: any) {
    logger.error(
      `Error occurred while onboarding user ${userId}: ${safeStringify(error)}`,
    );
    return res.status(400).json({
      message: `Error occurred while updating user ${userId}: ${error.message}`,
    });
  }
}

export default withAuth(handler);
