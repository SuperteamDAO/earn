import { NextApiRequestWithSponsor, withSponsorAuth } from "@/features/auth";
import { ListingFormData } from "@/features/listing-builder";
import logger from "@/lib/logger";
import { prisma } from "@/prisma";
import { cleanSkills } from "@/utils/cleanSkills";
import { safeStringify } from "@/utils/safeStringify";
import { Prisma } from "@prisma/client";
import { franc } from "franc";
import { NextApiResponse } from "next";

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  try {
    const userId = req.userId;
    const userSponsorId = req.userSponsorId;

    if(!userId) {
      logger.warn('Invalid token: User Id is missing');
      return res.status(400).json({ error: 'Invalid token' });
    }

    if (!userSponsorId) {
      logger.warn('Invalid token: User Sponsor Id is missing');
      return res.status(400).json({ error: 'Invalid token' });
    }

    logger.debug(`Request body: ${safeStringify(req.body)}`);

    const {
      id,
      title,
      slug,
      deadline,
      templateId,
      pocSocials,
      timeToComplete,
      description,
      type,
      region,
      eligibility,
      rewardAmount,
      rewards,
      maxBonusSpots,
      token,
      compensationType,
      minRewardAsk,
      maxRewardAsk,
      isPrivate,
      skills
    } = req.body as Partial<ListingFormData>;

    const language = description ? franc(description) : 'eng';

    const cleanedSkills = skills ? cleanSkills(skills) : undefined;

    const data: Prisma.BountiesUncheckedCreateInput = {
      title: title || 'Untitled Draft',
      slug: slug || `draft-${Date.now()}`,
      description,
      deadline: deadline ? new Date(deadline) : undefined,
      pocSocials,
      timeToComplete,
      templateId,
      type,
      region,
      eligibility: eligibility as Prisma.InputJsonValue,
      rewardAmount,
      rewards: rewards as Prisma.InputJsonValue,
      maxBonusSpots,
      token,
      compensationType,
      minRewardAsk,
      maxRewardAsk,
      isPrivate,
      skills: cleanedSkills as Prisma.InputJsonValue,
      language,
      sponsorId: userSponsorId,
      pocId: userId,
    };

    const result = id 
      ? await prisma.bounties.update({
        where: { id },
        data,
      })
      : await prisma.bounties.create({
        data,
      });

    logger.debug(`Draft saved successfully: ${result.id}`);

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error saving draft:', error);
    return res.status(500).json({ error: 'Failed to save draft' });
  }
}

export default withSponsorAuth(handler);
