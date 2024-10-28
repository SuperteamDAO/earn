import type { NextApiResponse } from 'next';

import {
  type NextApiRequestWithUser,
  userSelectOptions,
  withAuth,
} from '@/features/auth';
import {
  extractDiscordUsername,
  extractGitHubUsername,
  extractLinkedInUsername,
  extractTelegramUsername,
  extractTwitterUsername,
} from '@/features/talent';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { cleanSkills } from '@/utils/cleanSkills';
import { safeStringify } from '@/utils/safeStringify';
import { validateSolanaAddress } from '@/utils/validateSolAddress';

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
    publicKey,
  } = req.body;

  try {
    if (publicKey) {
      const walletValidation = validateSolanaAddress(publicKey);

      if (!walletValidation.isValid) {
        return res.status(400).json({
          error: 'Invalid Wallet Address',
          message:
            walletValidation.error || 'Invalid Solana wallet address provided.',
        });
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: userId as string },
    });

    if (!user) {
      logger.warn(`User not found for user ID: ${userId}`);
      return res.status(404).json({ error: 'User not found' });
    }

    const correctedSkills = cleanSkills(skills);

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
      publicKey,
      skills: correctedSkills,
      superteamLevel: 'Lurker',
      isTalentFilled: true,
    };

    if (data.twitter) {
      const username = extractTwitterUsername(data.twitter);
      data.twitter = `https://x.com/${username}` || null;
    }

    if (data.github) {
      const username = extractGitHubUsername(data.github);
      data.github = `https://github.com/${username}` || null;
    }

    if (data.linkedin) {
      const username = extractLinkedInUsername(data.linkedin);
      data.linkedin = `https://linkedin.com/in/${username}` || null;
    }

    if (data.discord) {
      const username = extractDiscordUsername(data.discord);
      data.discord = username || null;
    }

    if (data.telegram) {
      const username = extractTelegramUsername(data.telegram);
      data.telegram = `https://t.me/${username}` || null;
    }

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
      select: userSelectOptions,
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
