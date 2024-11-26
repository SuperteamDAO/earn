import { franc } from 'franc';
import type { NextApiResponse } from 'next';

import { BONUS_REWARD_POSITION } from '@/constants';
import {
  checkListingSponsorAuth,
  type NextApiRequestWithSponsor,
  withSponsorAuth,
} from '@/features/auth';
import { sendEmailNotification } from '@/features/emails';
import {
  backendListingRefinements,
  createListingFormSchema,
  createListingRefinements,
} from '@/features/listing-builder';
import { isDeadlineOver } from '@/features/listings';
import earncognitoClient from '@/lib/earncognitoClient';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { cleanSkills } from '@/utils/cleanSkills';
import { dayjs } from '@/utils/dayjs';
import { fetchTokenUSDValue } from '@/utils/fetchTokenUSDValue';
import { filterAllowedFields } from '@/utils/filterAllowedFields';
import { safeStringify } from '@/utils/safeStringify';

const allowedFields = [
  'type',
  'status',
  'title',
  'skills',
  'slug',
  'deadline',
  'templateId',
  'pocSocials',
  'applicationType',
  'description',
  'eligibility',
  'references',
  'region',
  'referredBy',
  'isPrivate',
  'requirements',
  'rewardAmount',
  'rewards',
  'maxBonusSpots',
  'token',
  'compensationType',
  'minRewardAsk',
  'maxRewardAsk',
  'isPublished',
  'isFndnPaying',
  'hackathonId',
];

async function listing(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  const { id } = req.query;
  console.log('req body', req.body);
  const data = filterAllowedFields(req.body, allowedFields);
  const userId = req.userId;
  const userSponsorId = req.userSponsorId;

  logger.debug(`Request query: ${safeStringify(req.query)}`);
  logger.debug(`Request body: ${safeStringify(req.body)}`);

  if (!userId) {
    logger.warn('Invalid token: User Id is missing');
    return res.status(400).json({ error: 'Invalid token' });
  }

  if (!userSponsorId) {
    logger.warn('Invalid token: User Sponsor Id is missing');
    return res.status(400).json({ error: 'Invalid token' });
  }

  try {
    const userSponsorId = req.userSponsorId;
    const userId = req.userId;

    const { error, listing } = await checkListingSponsorAuth(
      userSponsorId,
      id as string,
    );
    if (error) {
      return res.status(error.status).json({ error: error.message });
    }

    const sponsor = await prisma.sponsors.findUnique({
      where: { id: userSponsorId },
      select: { isCaution: true, isVerified: true, st: true },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId as string },
    });

    console.log('req hackathon id', req.body.hackathonId);
    const hackathon = req.body.hackathonId
      ? (await prisma.hackathon.findUnique({
          where: {
            id: req.body.hackathonId,
          },
        })) || undefined
      : undefined;

    console.log('hackathon in update', hackathon);
    // Create schema instance with correct parameters
    const listingSchema = createListingFormSchema({
      isGod: user?.role === 'GOD',
      isEditing: true,
      isST: !!sponsor?.st,
      hackathon,
      pastListing: listing as any,
    });
    const innerSchema = listingSchema._def.schema.omit({
      isPublished: true,
      isWinnersAnnounced: true,
      totalWinnersSelected: true,
      totalPaymentsMade: true,
      status: true,
      publishedAt: true,
      sponsorId: true,
    });
    const superValidator = innerSchema.superRefine(async (data, ctx) => {
      await createListingRefinements(data as any, ctx, hackathon);
      await backendListingRefinements(data as any, ctx);
    });

    console.log('api data', data);
    const validatedData = await superValidator.parseAsync({
      ...listing, // Existing data as base
      ...data, // Merge update data
    });

    const {
      rewards,
      rewardAmount,
      token,
      maxRewardAsk,
      minRewardAsk,
      compensationType,
      description,
      skills,
      type = listing.type,
    } = validatedData;

    let { maxBonusSpots } = validatedData;
    const { status } = listing;
    const { isPublished } = listing;

    // Check if listing is editable
    const pastDeadline = isDeadlineOver(listing?.deadline || undefined);
    if (pastDeadline && user?.role !== 'GOD') {
      return res.status(400).json({
        message: `Listing is past deadline, hence cannot be edited`,
      });
    }

    if (!listing.isPublished && req.role !== 'GOD') {
      return res.status(400).json({
        message: `Listing is not published, hence cannot be edited`,
      });
    }

    if (listing.maxBonusSpots > 0 && typeof maxBonusSpots === 'undefined') {
      maxBonusSpots = 0;
    }

    // Handle skills update
    const skillsToUpdate =
      'skills' in validatedData
        ? skills
          ? cleanSkills(skills)
          : []
        : undefined;

    // Handle winners count update
    const newRewardsCount = Object.keys(rewards || {}).length;
    const currentTotalWinners = listing.totalWinnersSelected
      ? listing.totalWinnersSelected - (maxBonusSpots ?? 0)
      : 0;

    let totalWinnersSelected = 0;
    if (newRewardsCount < currentTotalWinners) {
      totalWinnersSelected = newRewardsCount;

      for (
        let position = newRewardsCount + 1;
        position <= currentTotalWinners;
        position++
      ) {
        logger.debug(
          `Resetting winner position: ${position} for listing ID: ${id}`,
        );
        await prisma.submission.updateMany({
          where: {
            listingId: id as string,
            isWinner: true,
            winnerPosition: position,
          },
          data: {
            isWinner: false,
            winnerPosition: null,
          },
        });
      }
    }

    // Handle bonus submissions update
    if ((maxBonusSpots ?? 0) < listing.maxBonusSpots) {
      const bonusSubmissionsToUpdate = await prisma.submission.findMany({
        where: {
          listingId: id as string,
          isWinner: true,
          winnerPosition: BONUS_REWARD_POSITION,
        },
        select: { id: true },
        take: listing.maxBonusSpots - (maxBonusSpots ?? 0),
      });
      await prisma.submission.updateMany({
        where: {
          id: {
            in: bonusSubmissionsToUpdate.map(({ id }) => id),
          },
          listingId: id as string,
          isWinner: true,
          winnerPosition: BONUS_REWARD_POSITION,
        },
        data: {
          isWinner: false,
          winnerPosition: null,
        },
      });
    }

    // Handle verification status
    const isVerifying = listing.status === 'VERIFYING';

    // Calculate USD value
    let usdValue = 0;
    if (isPublished && listing.publishedAt && !isVerifying) {
      try {
        let amount;
        if (compensationType === 'fixed') {
          amount = rewardAmount;
        } else if (compensationType === 'range') {
          amount = ((minRewardAsk || 0) + (maxRewardAsk || 0)) / 2;
        }
        if (token && amount) {
          const tokenUsdValue = await fetchTokenUSDValue(
            token,
            listing.publishedAt,
          );
          usdValue = tokenUsdValue * amount;
        }
      } catch (err) {
        logger.error('Error calculating USD value -', err);
      }
    }

    const language = description ? franc(description) : 'eng';
    const isFndnPaying =
      sponsor?.st && type !== 'project' ? data.isFndnPaying : false;

    // Update listing
    const result = await prisma.bounties.update({
      where: { id: id as string },
      data: {
        ...validatedData,
        status: isVerifying ? 'VERIFYING' : status || listing?.status || 'OPEN',
        isPublished,
        usdValue,
        language,
        isFndnPaying,
        totalWinnersSelected,
        templateId: validatedData.templateId || null,
        id: validatedData.id || undefined,
        eligibility: validatedData.eligibility || undefined,
        rewards: rewards || undefined,
        maxBonusSpots: maxBonusSpots || undefined,
        ...(skillsToUpdate !== undefined && { skills: skillsToUpdate }),
      },
    });

    // Handle discord notifications
    try {
      await earncognitoClient.post(`/discord/listing-update`, {
        listingId: result.id,
        status: 'Updated',
      });
    } catch (err) {
      logger.error('Discord Listing Update Message Error', err);
    }

    // Handle deadline change notification
    const deadlineChanged =
      listing.deadline?.toString() !== result.deadline?.toString();
    if (deadlineChanged && result.isPublished && userId) {
      const dayjsDeadline = dayjs(result.deadline);
      logger.debug(
        `Creating comment for deadline extension for listing ID: ${result.id}`,
      );
      await prisma.comment.create({
        data: {
          message: `The deadline for this listing has been updated to ${dayjsDeadline.format('h:mm A, MMMM D, YYYY (UTC)')}`,
          refId: result.id,
          refType: 'BOUNTY',
          authorId: userId,
          type: 'DEADLINE_EXTENSION',
        },
      });

      logger.debug(`Sending email notification for deadline extension`);
      sendEmailNotification({
        type: 'deadlineExtended',
        id: id as string,
        triggeredBy: req.userId,
      });
    }

    logger.info(`Listing with ID: ${id} updated successfully`);
    logger.debug(`Updated Listing data: ${safeStringify(result)}`);

    return res.status(200).json(result);
  } catch (error: any) {
    console.log('error', JSON.stringify(error));
    logger.error(
      `Error occurred while updating listing with id = ${id}: ${safeStringify(error)}`,
    );
    return res.status(400).json({
      error: error.message,
      message: `Error occurred while updating listing with id = ${id}.`,
    });
  }
}

export default withSponsorAuth(listing);
