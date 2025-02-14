import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { cleanSkills } from '@/utils/cleanSkills';
import { filterAllowedFields } from '@/utils/filterAllowedFields';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithUser } from '@/features/auth/types';
import { withAuth } from '@/features/auth/utils/withAuth';
import { extractSocialUsername } from '@/features/social/utils/extractUsername';
import { profileSchema, usernameSuperRefine } from '@/features/talent/schema';

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
];

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;
  logger.info(
    `Handling request for user ID: ${userId} - ${safeStringify(req.body)}`,
  );

  const user = await prisma.user.findUnique({
    where: { id: userId as string },
  });

  if (!user) {
    logger.warn(`User not found for user ID: ${userId}`);
    return res.status(404).json({ error: 'User not found' });
  }
  const filteredData = filterAllowedFields(req.body, allowedFields);
  type SchemaKeys = keyof typeof profileSchema._def.schema.shape;
  const keysToValidate = Object.keys(filteredData).reduce<
    Record<SchemaKeys, true>
  >(
    (acc, key) => {
      acc[key as SchemaKeys] = true;
      return acc;
    },
    {} as Record<SchemaKeys, true>,
  );
  const partialSchema = profileSchema._def.schema
    .pick(keysToValidate)
    .superRefine((data, ctx) => {
      usernameSuperRefine(data, ctx, user.id);
    });
  const updatedData = await partialSchema.parseAsync({
    ...filteredData,
    github:
      filteredData.github !== undefined
        ? extractSocialUsername('github', filteredData.github) || ''
        : undefined,
    twitter:
      filteredData.twitter !== undefined
        ? extractSocialUsername('twitter', filteredData.twitter) || ''
        : undefined,
    linkedin:
      filteredData.linkedin !== undefined
        ? extractSocialUsername('linkedin', filteredData.linkedin) || ''
        : undefined,
    telegram:
      filteredData.telegram !== undefined
        ? extractSocialUsername('telegram', filteredData.telegram) || ''
        : undefined,
  });

  const correctedSkills = updatedData.skills
    ? cleanSkills(updatedData.skills)
    : undefined;
  logger.info(`Corrected skills: ${safeStringify(correctedSkills)}`);

  try {
    logger.debug(`Updated data to be saved: ${safeStringify(updatedData)}`);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...updatedData,
        ...(correctedSkills
          ? {
              skills: correctedSkills,
            }
          : {}),
        interests: updatedData.interests
          ? JSON.stringify(updatedData.interests)
          : undefined,
        community: updatedData.community
          ? JSON.stringify(updatedData.community)
          : undefined,
      },
      select: {
        email: true,
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
