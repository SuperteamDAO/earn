import { type Prisma } from '@prisma/client';
import { franc } from 'franc';
import type { NextApiResponse } from 'next';

import {
  checkListingSponsorAuth,
  type NextApiRequestWithSponsor,
  withSponsorAuth,
} from '@/features/auth';
import {
  backendListingRefinements,
  createListingFormSchema,
  createListingRefinements,
} from '@/features/listing-builder';
import earncognitoClient from '@/lib/earncognitoClient';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { cleanSkills } from '@/utils/cleanSkills';
import { dayjs } from '@/utils/dayjs';
import { fetchTokenUSDValue } from '@/utils/fetchTokenUSDValue';
import { safeStringify } from '@/utils/safeStringify';

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  const id = req.query.id as string;
  const userId = req.userId;
  const userSponsorId = req.userSponsorId;

  if (!userId) {
    logger.warn('Invalid token: User Id is missing');
    return res.status(400).json({ error: 'Invalid token' });
  }

  if (!userSponsorId) {
    logger.warn('Invalid token: User Sponsor Id is missing');
    return res.status(400).json({ error: 'Invalid token' });
  }

  logger.debug(`Request body: ${safeStringify(req.body)}`);

  try {
    const sponsor = await prisma.sponsors.findUnique({
      where: { id: userSponsorId },
      select: { isCaution: true, isVerified: true, st: true },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId as string },
    });

    const { error, listing } = await checkListingSponsorAuth(
      userSponsorId,
      id as string,
    );
    if (error) {
      return res.status(error.status).json({ error: error.message });
    }

    if (listing.isPublished) {
      return res.status(400).json({
        message: `Listing is already published, hence cannot be published again`,
      });
    }
    const hackathon = req.body.hackathonId
      ? (await prisma.hackathon.findUnique({
          where: {
            id: req.body.hackathonId,
          },
        })) || undefined
      : undefined;

    console.log('hackathon in publish', hackathon);

    const listingSchema = createListingFormSchema({
      isGod: user?.role === 'GOD',
      isEditing: false,
      isST: !!sponsor?.st,
      hackathon,
    });

    const innerSchema = listingSchema._def.schema;
    const superValidator = innerSchema.superRefine(async (data, ctx) => {
      await createListingRefinements(data as any, ctx, hackathon);
      await backendListingRefinements(data as any, ctx);
    });
    console.log('req.body', req.body);
    const validatedData = await superValidator.parseAsync(req.body);

    const {
      title,
      skills,
      slug,
      deadline,
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
      isFndnPaying: rawIsFndnPaying,
      hackathonId,
    } = validatedData;

    let isPublished = true;
    let publishedAt;
    const language = description ? franc(description) : 'eng';
    const correctedSkills = cleanSkills(skills);

    let isVerifying = false;

    if (isPublished) {
      publishedAt = new Date();

      if (sponsor) {
        // sponsor is sus, be caution
        isVerifying = sponsor.isCaution;

        if (!isVerifying) {
          // sponsor never had a live listing
          const bountyCount = await prisma.bounties.count({
            where: {
              sponsorId: userSponsorId,
              isArchived: false,
              isPublished: true,
              isActive: true,
            },
          });
          isVerifying = bountyCount === 0;
        }

        // sponsor is unverified and latest listing is in review for more than 2 weeks
        if (!isVerifying && !sponsor.isVerified) {
          const twoWeeksAgo = dayjs().subtract(2, 'weeks');

          const overdueBounty = await prisma.bounties.findFirst({
            select: { id: true },
            where: {
              sponsorId: userSponsorId,
              isArchived: false,
              isPublished: true,
              isActive: true,
              isWinnersAnnounced: false,
              deadline: {
                lt: twoWeeksAgo.toDate(),
              },
            },
          });

          isVerifying = !!overdueBounty;
        }
      }
    }

    if (isVerifying) {
      isPublished = false;
      publishedAt = null;
    }

    let usdValue = 0;
    if (isPublished && publishedAt && !isVerifying) {
      try {
        let amount;
        if (compensationType === 'fixed') {
          amount = rewardAmount;
        } else if (compensationType === 'range') {
          amount = ((minRewardAsk || 0) + (maxRewardAsk || 0)) / 2;
        }

        if (amount && token) {
          const tokenUsdValue = await fetchTokenUSDValue(token, publishedAt);
          usdValue = tokenUsdValue * amount;
        }
      } catch (error) {
        logger.error('Error calculating USD value:', error);
      }
    }

    const isFndnPaying =
      sponsor?.st && type !== 'project' ? rawIsFndnPaying : false;

    const data: Prisma.BountiesUncheckedCreateInput = {
      sponsorId: userSponsorId,
      title,
      usdValue,
      pocId: userId,
      skills: correctedSkills,
      slug,
      deadline: new Date(deadline),
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
      language,
      isFndnPaying,
      status: isVerifying ? 'VERIFYING' : 'OPEN',
      publishedAt,
      isPublished,
      hackathonId,
    };

    logger.debug(`Publishing listing with data: ${safeStringify(data)}`);
    const result = await prisma.bounties.update({
      where: { id },
      data,
    });

    if (isVerifying) {
      try {
        if (!process.env.EARNCOGNITO_URL) {
          throw new Error('ENV EARNCOGNITO_URL not provided');
        }
        await earncognitoClient.post(`/discord/verify-listing/initiate`, {
          listingId: result.id,
        });
      } catch (err) {
        logger.error('Failed to send Verification Message to discord', err);
      }
    } else {
      try {
        await earncognitoClient.post(`/discord/listing-update`, {
          listingId: result?.id,
          status: result.isPublished
            ? 'Published'
            : isVerifying
              ? 'To be Verified'
              : 'Draft Added',
        });
      } catch (err) {
        logger.error('Discord Listing Update Message Error', err);
      }
    }

    logger.info(`Bounty created successfully with ID: ${result.id}`);
    logger.debug(`Created bounty data: ${safeStringify(result)}`);

    return res.status(200).json(result);
  } catch (error: any) {
    console.log('error', error);
    logger.error(
      `User ${userId} unable to create a listing: ${safeStringify(error)}`,
    );
    return res.status(400).json({
      error: error.message,
      message: 'Error occurred while adding a new bounty.',
    });
  }
}

export default withSponsorAuth(handler);
