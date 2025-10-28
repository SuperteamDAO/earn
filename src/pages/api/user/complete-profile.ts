import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { privy } from '@/lib/privy';
import { prisma } from '@/prisma';
import { cleanSkills } from '@/utils/cleanSkills';
import { verifyImageExists } from '@/utils/cloudinary';
import { filterAllowedFields } from '@/utils/filterAllowedFields';
import { generateUniqueReferralCode } from '@/utils/referralCodeGenerator';
import { safeStringify } from '@/utils/safeStringify';

import { userSelectOptions } from '@/features/auth/constants/userSelectOptions';
import { type NextApiRequestWithUser } from '@/features/auth/types';
import { withAuth } from '@/features/auth/utils/withAuth';
import { extractSocialUsername } from '@/features/social/utils/extractUsername';
import {
  profileSchema,
  socialSuperRefine,
  usernameSuperRefine,
} from '@/features/talent/schema';

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

    const referralCodeRaw = (req.body?.referralCode || '')
      .toString()
      .trim()
      .toUpperCase();

    const referredByUpdate: { referredById?: string } = {};
    if (referralCodeRaw && !user.referredById) {
      try {
        const inviter = await prisma.user.findUnique({
          where: { referralCode: referralCodeRaw },
          select: { id: true },
        });
        if (inviter && inviter.id !== user.id) {
          const accepted = await prisma.user.count({
            where: { referredById: inviter.id },
          });
          if (accepted < 10) {
            referredByUpdate.referredById = inviter.id;
          } else {
            logger.info(
              `Referral cap reached for inviter ${inviter.id}, ignoring referralCode during profile completion`,
            );
          }
        } else if (!inviter) {
          logger.info(`Invalid referralCode provided on profile completion`);
        }
      } catch (e) {
        logger.error(
          `Error validating referral code on profile completion: ${safeStringify(e)}`,
        );
      }
    }

    if (filteredData.photo && typeof filteredData.photo === 'string') {
      try {
        const imageExists = await verifyImageExists(filteredData.photo);
        if (!imageExists) {
          logger.warn(
            `Photo verification failed for user ${userId}: ${filteredData.photo}`,
          );
          return res.status(400).json({
            error: 'Invalid photo: Image does not exist in our storage',
          });
        }
        logger.info(
          `Photo verification successful for user ${userId}: ${filteredData.photo}`,
        );
      } catch (error: any) {
        logger.warn(
          `Photo verification error for user ${userId}: ${safeStringify(error)}`,
        );
        filteredData.photo = user.photo || undefined;
      }
    }

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

    const createWalletResponse = await privy.wallets().create({
      chain_type: 'solana',
      owner: {
        user_id: user.privyDid,
      },
    });

    const walletAddress = createWalletResponse.address;

    const referralCode = await generateUniqueReferralCode();

    await prisma.user.update({
      where: {
        id: userId as string,
      },
      data: {
        ...updatedData,
        ...referredByUpdate,
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
        isTalentFilled: true,
        walletAddress,
        referralCode,
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
    return res.status(500).json({
      message: `Error occurred while updating user ${userId}: ${error.message}`,
    });
  }
}

export default withAuth(handler);

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};
