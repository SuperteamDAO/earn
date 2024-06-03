import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
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

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;

  const user = await prisma.user.findUnique({
    where: {
      id: userId as string,
    },
  });

  // eslint-disable-next-line
  const { role, skills, currentSponsorId, generateTalentEmailSettings, ...updateAttributes } = req.body;
  let result;
  const correctedSkills = skills ? correctSkills(skills) : [];
  try {
    const updatedData = {
      ...updateAttributes,
    };

    if (skills) {
      updatedData.skills = correctedSkills;
    }

    if (user && user.role === 'GOD' && currentSponsorId) {
      updatedData.currentSponsorId = currentSponsorId;
    }

    if (generateTalentEmailSettings) {
      const categories = new Set();

      categories.add('createListing');
      categories.add('scoutInvite');
      categories.add('commentOrLikeSubmission');
      categories.add('weeklyListingRoundup');
      categories.add('replyOrTagComment');
      categories.add('productAndNewsletter');

      for (const category of categories) {
        await prisma.emailSettings.create({
          data: {
            user: { connect: { id: userId as string } },
            category: category as string,
          },
        });
      }
    }

    result = await prisma.user.update({
      where: {
        id: userId as string,
      },
      data: updatedData,
      include: {
        currentSponsor: true,
        UserSponsors: true,
        Hackathon: true,
        Submission: true,
        emailSettings: true,
      },
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error(`User ${userId} unable to onboard`, error.message);

    return res.status(400).json({
      message: `Error occurred while updating user ${userId}.`,
    });
  }
}

export default withAuth(handler);
