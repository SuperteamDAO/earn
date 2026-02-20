import { waitUntil } from '@vercel/functions';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import logger from '@/lib/logger';
import { privy } from '@/lib/privy';
import { prisma } from '@/prisma';
import { cleanSkills } from '@/utils/cleanSkills';
import { verifyImageExists } from '@/utils/cloudinary';
import { filterAllowedFields } from '@/utils/filterAllowedFields';
import { generateUniqueReferralCode } from '@/utils/referralCodeGenerator';
import { safeStringify } from '@/utils/safeStringify';

import { userSelectOptions } from '@/features/auth/constants/userSelectOptions';
import { getUserSession } from '@/features/auth/utils/getUserSession';
import { refreshUserMembershipLevel } from '@/features/membership/utils/refreshUserMembershipLevel';
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

export async function POST(request: NextRequest) {
  const sessionResponse = await getUserSession(await headers());

  if (sessionResponse.status !== 200 || !sessionResponse.data) {
    logger.warn(`Authentication failed: ${sessionResponse.error}`);
    return NextResponse.json(
      { error: sessionResponse.error },
      { status: sessionResponse.status },
    );
  }

  const { userId } = sessionResponse.data;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  logger.debug(`Request body: ${safeStringify(body)}`);

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      logger.warn(`User not found for user ID: ${userId}`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const filteredData = filterAllowedFields(body, allowedFields);

    const referralCodeRaw = (body?.referralCode || '')
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
          return NextResponse.json(
            { error: 'Invalid photo: Image does not exist in our storage' },
            { status: 400 },
          );
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

    const github =
      typeof filteredData.github === 'string' ? filteredData.github : undefined;
    const twitter =
      typeof filteredData.twitter === 'string'
        ? filteredData.twitter
        : undefined;
    const linkedin =
      typeof filteredData.linkedin === 'string'
        ? filteredData.linkedin
        : undefined;
    const telegram =
      typeof filteredData.telegram === 'string'
        ? filteredData.telegram
        : undefined;

    const updatedData = await partialSchema.parseAsync({
      ...filteredData,
      github: github
        ? extractSocialUsername('github', github) || undefined
        : undefined,
      twitter: twitter
        ? extractSocialUsername('twitter', twitter) || undefined
        : undefined,
      linkedin: linkedin
        ? extractSocialUsername('linkedin', linkedin) || undefined
        : undefined,
      telegram: telegram
        ? extractSocialUsername('telegram', telegram) || undefined
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
          user: { connect: { id: userId } },
          category,
        },
      });
    }

    logger.info(
      `Completing user profile with data: ${safeStringify(updatedData)}`,
    );

    let walletAddress = user.walletAddress;
    if (!walletAddress) {
      const createWalletResponse = await privy.wallets().create({
        chain_type: 'solana',
        owner: {
          user_id: user.privyDid,
        },
      });
      walletAddress = createWalletResponse.address;
    } else {
      logger.info(`Using existing wallet for user ${userId}: ${walletAddress}`);
    }

    const referralCode =
      user.referralCode ?? (await generateUniqueReferralCode());

    await prisma.user.update({
      where: {
        id: userId,
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

    waitUntil(
      refreshUserMembershipLevel({
        userId,
        email: user.email,
        currentSuperteamLevel: user.superteamLevel ?? null,
      }),
    );

    const result = await prisma.user.findUnique({
      where: { id: userId },
      select: userSelectOptions,
    });

    logger.info(`User onboarded successfully for user ID: ${userId}`);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    logger.error(
      `Error occurred while onboarding user ${userId}: ${safeStringify(error)}`,
    );
    return NextResponse.json(
      {
        message: `Error occurred while updating user ${userId}: ${error.message}`,
      },
      { status: 500 },
    );
  }
}
