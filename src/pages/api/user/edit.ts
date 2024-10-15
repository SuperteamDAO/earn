import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
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
import { filterAllowedFields } from '@/utils/filterAllowedFields';
import { safeStringify } from '@/utils/safeStringify';

const allowedFields = [
  'username',
  'photo',
  'firstName',
  'lastName',
  'interests',
  'bio',
  'twitter',
  'discord',
  'github',
  'linkedin',
  'website',
  'telegram',
  'community',
  'experience',
  'location',
  'cryptoExperience',
  'workPrefernce',
  'currentEmployer',
  'skills',
  'private',
  'publicKey',
];

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;
  logger.info(
    `Handling request for user ID: ${userId} - ${safeStringify(req.body)}`,
  );

  const { skills, ...data } = req.body;

  const updatedData = filterAllowedFields(data, allowedFields);

  if (updatedData.twitter) {
    const username = extractTwitterUsername(updatedData.twitter);
    updatedData.twitter = `https://x.com/${username}` || null;
  }

  if (updatedData.github) {
    const username = extractGitHubUsername(updatedData.github);
    updatedData.github = `https://github.com/${username}` || null;
  }

  if (updatedData.linkedin) {
    const username = extractLinkedInUsername(updatedData.linkedin);
    updatedData.linkedin = `https://linkedin.com/in/${username}` || null;
  }

  if (updatedData.discord) {
    const username = extractDiscordUsername(updatedData.discord);
    updatedData.discord = username || null;
  }

  if (updatedData.telegram) {
    const username = extractTelegramUsername(updatedData.telegram);
    updatedData.telegram = `https://t.me/${username}` || null;
  }

  const correctedSkills = cleanSkills(skills);
  logger.info(`Corrected skills: ${safeStringify(correctedSkills)}`);

  try {
    logger.debug(`Updated data to be saved: ${safeStringify(updatedData)}`);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...updatedData,
        skills: correctedSkills,
      },
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
