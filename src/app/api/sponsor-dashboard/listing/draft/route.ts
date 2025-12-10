import { franc } from 'franc';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

import earncognitoClient from '@/lib/earncognitoClient';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { type InputJsonValue } from '@/prisma/internal/prismaNamespace';
import {
  type BountiesModel,
  type BountiesUncheckedCreateInput,
} from '@/prisma/models/Bounties';
import { cleanSkills } from '@/utils/cleanSkills';
import { safeStringify } from '@/utils/safeStringify';

import {
  type ListingWithSponsor,
  validateListingSponsorAuth,
} from '@/features/auth/utils/checkListingSponsorAuth';
import { validateSession } from '@/features/auth/utils/getSponsorSession';
import type { ListingFormData } from '@/features/listing-builder/types';
import { getValidSlug } from '@/features/listing-builder/utils/getValidSlug';
import { validateDraftPermissions } from '@/features/listing-builder/utils/isListingDraftable';

async function transformToPrismaData(
  formData: Partial<ListingFormData>,
  userId: string,
  userSponsorId: string,
  existingListing?: ListingWithSponsor,
): Promise<BountiesUncheckedCreateInput> {
  const {
    title,
    slug,
    deadline,
    commitmentDate,
    templateId,
    pocSocials,
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
    skills,
    isFndnPaying,
    hackathonId,
    referredBy,
  } = formData as Partial<ListingFormData>;

  const processedTitle = title || 'Untitled Draft';
  const language = description ? franc(description) : 'eng';
  const cleanedSkills = skills ? cleanSkills(skills) : undefined;

  const uniqueSlug = await getValidSlug({
    id: formData.id || undefined,
    title: processedTitle,
    slug,
    listing: existingListing || undefined,
  });

  return {
    title: processedTitle,
    slug: uniqueSlug,
    description,
    deadline: deadline ? new Date(deadline) : undefined,
    commitmentDate: commitmentDate ? new Date(commitmentDate) : undefined,
    pocSocials,
    templateId,
    type,
    region,
    eligibility: eligibility as InputJsonValue,
    rewardAmount,
    rewards: rewards as InputJsonValue,
    maxBonusSpots: maxBonusSpots === undefined ? undefined : maxBonusSpots || 0,
    token,
    compensationType,
    minRewardAsk,
    maxRewardAsk,
    isPrivate,
    skills: cleanedSkills as InputJsonValue,
    language,
    sponsorId: userSponsorId,
    isFndnPaying,
    hackathonId,
    referredBy,
    pocId: existingListing?.pocId || userId,
  };
}

async function saveListing(
  listingId: string | undefined,
  data: BountiesUncheckedCreateInput,
) {
  return listingId
    ? await prisma.bounties.update({ where: { id: listingId }, data })
    : await prisma.bounties.create({ data });
}

async function handleDiscordNotification(result: BountiesModel): Promise<void> {
  if (result.status !== 'VERIFYING') {
    return;
  }

  try {
    logger.info('Updating Discord Verification message', { id: result.id });
    await earncognitoClient.post(`/telegram/verify-listing`, {
      listingId: result.id,
    });
    logger.info('Updated Discord Verification message', { id: result.id });
  } catch (err) {
    logger.error('Failed to update Verification Message to discord', err);
  }
}

export async function POST(request: Request) {
  try {
    const sessionResult = await validateSession(await headers());
    if ('error' in sessionResult) {
      return sessionResult.error;
    }
    const { userId, userSponsorId } = sessionResult.session;

    let body: Partial<ListingFormData>;
    try {
      body = await request.json();
    } catch (jsonError) {
      const rawText = await request.text();
      logger.debug('Request body raw:', rawText);
      logger.error('Failed to parse JSON request body', {
        error: jsonError,
      });
      return NextResponse.json(
        {
          error: 'Invalid JSON in request body',
          message:
            jsonError instanceof Error
              ? jsonError.message
              : 'Unknown JSON parsing error',
        },
        { status: 400 },
      );
    }
    logger.debug(`Request body: ${safeStringify(body)}`);

    let listing: ListingWithSponsor | undefined;
    if (body.id) {
      const result = await validateListingSponsorAuth(userSponsorId, body.id);
      if ('error' in result) {
        return result.error;
      }
      listing = result.listing;
    }

    const isDraftNotAllowed = validateDraftPermissions(listing);
    if (isDraftNotAllowed) {
      return isDraftNotAllowed;
    }

    const prismaData = await transformToPrismaData(
      body,
      userId,
      userSponsorId,
      listing,
    );

    const result = await saveListing(body.id || undefined, prismaData);
    logger.debug(`Draft saved successfully: ${result.id}`);

    await handleDiscordNotification(result);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.log('error', error);
    logger.error('Error saving draft:', error);
    return NextResponse.json(
      { error: 'Failed to save draft' },
      { status: 500 },
    );
  }
}
