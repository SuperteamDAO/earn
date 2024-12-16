import type { NextApiResponse } from 'next';

import { userSelectOptions } from '@/features/auth/constants';
import { type NextApiRequestWithUser } from '@/features/auth/types';
import { withAuth } from '@/features/auth/utils/withAuth';
import { extractSocialUsername } from '@/features/social/utils/extractUsername';
import {
  profileSchema,
  socialSuperRefine,
  usernameSuperRefine,
} from '@/features/talent/schema';
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

  logger.debug(`Request body: ${safeStringify(req.body)}`);

  try {
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
        socialSuperRefine(data, ctx);
        usernameSuperRefine(data, ctx, user.id);
      });
    const updatedData = await partialSchema.parseAsync({
      ...filteredData,
      github: filteredData.github
        ? extractSocialUsername('github', filteredData.github) || undefined
        : undefined,
      twitter: filteredData.twitter
        ? extractSocialUsername('twitter', filteredData.twitter) || undefined
        : undefined,
      linkedin: filteredData.linkedin
        ? extractSocialUsername('linkedin', filteredData.linkedin) || undefined
        : undefined,
      telegram: filteredData.telegram
        ? extractSocialUsername('telegram', filteredData.telegram) || undefined
        : undefined,
    });

    const correctedSkills = updatedData.skills
      ? cleanSkills(updatedData.skills)
      : undefined;

    const categories = new Set([
      'createListing',
      'scoutInvite',
      'commentOrLikeSubmission',
      'weeklyListingRoundup',
      'replyOrTagComment',
      'productAndNewsletter',
    ]);

    for (const category of categories) {
      await prisma.emailSettings.deleteMany({
        where: {
          userId,
          category,
        },
      });
      await prisma.emailSettings.create({
        data: {
          user: { connect: { id: userId as string } },
          category: category as string,
        },
      });
    }

    logger.info(
      `Completing user profile with data: ${safeStringify(updatedData)}`,
    );

    await prisma.user.updateMany({
      where: {
        id: userId as string,
      },
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
        superteamLevel: 'Lurker',
        isTalentFilled: true,
      },
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
