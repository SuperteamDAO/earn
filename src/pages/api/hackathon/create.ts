import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const {
    title,
    hackathonSponsor,
    pocId,
    skills,
    slug,
    templateId,
    pocSocials,
    applicationType,
    timeToComplete,
    description,
    type,
    region,
    referredBy,
    references,
    requirements,
    rewardAmount,
    rewards,
    token,
    compensationType,
    minRewardAsk,
    maxRewardAsk,
    isPublished,
    isPrivate,
  } = req.body;

  logger.debug(`Request body: ${safeStringify(req.body)}`);

  const userId = req.userId;

  const user = await prisma.user.findUnique({
    where: {
      id: userId as string,
    },
  });

  if (!user) {
    return res
      .status(403)
      .json({ error: 'User does not have a current sponsor.' });
  }

  if (!user.hackathonId) {
    return res
      .status(403)
      .json({ error: 'User does not have a current sponsor.' });
  }

  try {
    const hackathon = await prisma.hackathon.findUnique({
      where: { id: user.hackathonId },
    });

    if (!hackathon) {
      return res.status(404).json({ error: 'Hackathon not found.' });
    }

    const eligibility: any = hackathon.eligibility
      ? hackathon.eligibility
      : null;

    const result = await prisma.bounties.create({
      data: {
        sponsorId: hackathonSponsor,
        title,
        slug,
        hackathonId: hackathon.id,
        deadline: hackathon.deadline,
        eligibility,
        pocId,
        skills,
        templateId,
        pocSocials,
        applicationType,
        timeToComplete,
        description,
        type,
        region,
        referredBy,
        references,
        requirements,
        rewardAmount,
        rewards,
        token,
        compensationType,
        minRewardAsk,
        maxRewardAsk,
        isPublished,
        isPrivate,
      },
      include: {
        sponsor: true,
      },
    });

    return res.status(200).json(result);
  } catch (error) {
    logger.error(error);
    return res.status(400).json({
      error,
      message: 'Error occurred while adding a new bounty.',
    });
  }
}

export default withAuth(handler);
