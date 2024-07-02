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

  const user = await prisma.user.findUnique({
    where: {
      id: userId as string,
    },
  });
  // eslint-disable-next-line
  const { role, skills, currentSponsorId, generateTalentEmailSettings, ...updateAttributes } = req.body;
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

    console.log('Updating user with data:', updatedData);

    await prisma.user.updateMany({
      where: {
        id: userId as string,
      },
      data: updatedData,
    });

    const result = await prisma.user.findUnique({
      where: {
        id: userId as string,
      },
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
    console.error(error.message);

    return res.status(400).json({
      message: `Error occurred while updating user ${userId}: ${error.message}`,
    });
  }
}

export default withAuth(handler);
