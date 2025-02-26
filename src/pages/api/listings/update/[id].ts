import { type Prisma } from '@prisma/client';
import { franc } from 'franc';
import type { NextApiResponse } from 'next';

import earncognitoClient from '@/lib/earncognitoClient';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { cleanSkills } from '@/utils/cleanSkills';
import { dayjs } from '@/utils/dayjs';
import { fetchTokenUSDValue } from '@/utils/fetchTokenUSDValue';
import { filterAllowedFields } from '@/utils/filterAllowedFields';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithSponsor } from '@/features/auth/types';
import { checkListingSponsorAuth } from '@/features/auth/utils/checkListingSponsorAuth';
import { withSponsorAuth } from '@/features/auth/utils/withSponsorAuth';
import { sendEmailNotification } from '@/features/emails/utils/sendEmailNotification';
import { BONUS_REWARD_POSITION } from '@/features/listing-builder/constants';
import {
  backendListingRefinements,
  createListingFormSchema,
  createListingRefinements,
} from '@/features/listing-builder/types/schema';
import { isDeadlineOver } from '@/features/listings/utils/deadline';

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
  'region',
  'isPrivate',
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

    const hackathon = req.body.hackathonId
      ? (await prisma.hackathon.findUnique({
          where: {
            id: req.body.hackathonId,
          },
        })) || undefined
      : undefined;
    if (req.body.hackathonId) {
      logger.info(`Listings connected hacakthon is fetched`, {
        listingId: id,
        hackathon: hackathon,
      });
    }

    logger.info('Processing Listings ZOD Validation ', {
      id,
      isGod: user?.role === 'GOD',
      isEditing: true,
      isST: !!sponsor?.st,
      hackathonId: hackathon?.id,
      pastListing: listing as any,
    });
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

    const validatedData = await superValidator.parseAsync({
      ...listing, // Existing data as base
      ...data, // Merge update data
    });
    logger.info('Listings ZOD Validation Successful ', {
      id,
      validatedData,
    });

    const {
      rewards: rewardsData,
      rewardAmount,
      token,
      maxRewardAsk,
      minRewardAsk,
      compensationType,
      description,
      skills,
      type = listing.type,
    } = validatedData;
    const isSponsorship = type === 'sponsorship';
    const rewards =
      (isSponsorship ? listing.rewards : rewardsData) ??
      ({} as Record<string, number>);

    let { maxBonusSpots } = validatedData;
    const { status } = listing;
    const { isPublished } = listing;

    // Check if listing is editable
    const pastDeadline = isDeadlineOver(listing?.deadline || undefined);
    logger.info('Check for past deadline of listing', {
      id,
      pastDeadline,
      deadline: listing?.deadline,
    });
    if (pastDeadline && user?.role !== 'GOD') {
      logger.warn(`Listing is past deadline, hence cannot be edited`, { id });
      return res.status(400).json({
        message: `Listing is past deadline, hence cannot be edited`,
      });
    }

    if (!listing.isPublished && req.role !== 'GOD') {
      logger.warn(`Listing is not published, hence cannot be edited`, { id });
      return res.status(400).json({
        message: `Listing is not published, hence cannot be edited`,
      });
    }

    if (listing.maxBonusSpots > 0 && typeof maxBonusSpots === 'undefined') {
      maxBonusSpots = 0;
      logger.warn(`Listing Max Bonus Spots is reset to 0`, { id });
    }

    const skillsToUpdate =
      'skills' in validatedData
        ? skills
          ? cleanSkills(skills)
          : []
        : undefined;
    logger.info('Listings Skills Cleaned ', {
      id,
      previousSkills: skills,
      cleanedSkills: skillsToUpdate,
    });
    // Handle winners count update
    const newRewardsCount = Object.keys(rewards || {}).length;
    const currentTotalWinners = listing.totalWinnersSelected
      ? listing.totalWinnersSelected - (maxBonusSpots ?? 0)
      : 0;

    let totalWinnersSelected = currentTotalWinners;
    // handle selected winners update
    if (newRewardsCount < currentTotalWinners) {
      logger.info(
        'Atempting to reset selected winners since new total winners are less than previous',
        {
          id,
          newRewardsCount,
          currentTotalWinners,
        },
      );
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
      logger.info(
        'Atempting to reset selected bonus winners since new bonus spots are less than previous',
        {
          id,
          newBonusSpots: maxBonusSpots,
          previousBonusSpots: listing.maxBonusSpots,
        },
      );
      const bonusSubmissionsToUpdate = await prisma.submission.findMany({
        where: {
          listingId: id as string,
          isWinner: true,
          winnerPosition: BONUS_REWARD_POSITION,
        },
        select: { id: true },
        take: listing.maxBonusSpots - (maxBonusSpots ?? 0),
      });
      logger.info('Updating the following bonus winner selected submissions ', {
        id,
        bonusSubmissionsToUpdate,
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

    const isVerifying = listing.status === 'VERIFYING';
    logger.info(`Previous Listing Verificatin status is ${isVerifying}`, {
      id,
      isVerifying,
    });

    let usdValue = isSponsorship ? listing.usdValue : 0;
    if (isPublished && listing.publishedAt && !isVerifying) {
      logger.info(`Calculating USD value of listing`, {
        id,
        isPublished,
        publishedAt: listing.publishedAt,
        isVerifying,
        token,
        compensationType,
      });
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
          logger.info('Token USD value fetched', {
            token,
            publishedAt: listing.publishedAt,
            tokenUsdValue,
            calculatedListingUSDValue: usdValue,
          });
        }
      } catch (err) {
        logger.error('Error calculating USD value -', err);
      }
    }

    const language = description ? franc(description) : 'eng';
    logger.info('Listings Language Detected ', {
      id,
      language,
    });
    const isFndnPaying =
      sponsor?.st && type !== 'project' ? data.isFndnPaying : false;
    logger.info('Is Foundation Paying', {
      isFndnPaying,
      st: sponsor?.st,
      type,
      rawIsFndnPaying: data.isFndnPaying,
    });

    const dataToUpdate: Prisma.BountiesUncheckedUpdateInput = {
      ...validatedData,
      status: isVerifying ? 'VERIFYING' : status || listing?.status || 'OPEN',
      isPublished,
      usdValue,
      language,
      isFndnPaying,
      totalWinnersSelected,
      templateId: validatedData.templateId || null,
      id: validatedData.id || undefined,
      eligibility: validatedData.eligibility || [],
      rewards: rewards || {},
      maxBonusSpots: maxBonusSpots || 0,
      ...(skillsToUpdate !== undefined && { skills: skillsToUpdate }),
    };
    logger.debug(`Updating listing with data: ${safeStringify(data)}`, {
      id,
    });
    const result = await prisma.bounties.update({
      where: { id: id as string },
      data: dataToUpdate,
    });
    logger.debug(`Update Listing Successful`, { id });

    try {
      logger.info('Sending Discord Listing Update message', {
        id,
        discordStatus: 'Updated',
      });
      await earncognitoClient.post(`/discord/listing-update`, {
        listingId: result.id,
        status: 'Updated',
      });
      logger.info('Sent Discord Listing Update message', {
        id,
      });
    } catch (err) {
      logger.error('Discord Listing Update Message Error', err);
    }

    const deadlineChanged =
      listing.deadline?.toString() !== result.deadline?.toString();
    if (deadlineChanged)
      logger.info('Deadline has beend changed', {
        id,
        previousDeadline: listing.deadline,
        newDeadline: result.deadline,
      });
    if (deadlineChanged && result.isPublished && userId) {
      const dayjsDeadline = dayjs(result.deadline);
      logger.debug(
        `Creating comment for deadline extension for listing ID: ${result.id}`,
        {
          id,
          deadlineChanged,
          isPublished: result.isPublished,
        },
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
      logger.debug(
        `Comment Created for deadline extension for listing ID: ${result.id}`,
        {
          id: result.id,
        },
      );

      logger.debug(`Sending email notification for deadline extension`, {
        id,
      });
      sendEmailNotification({
        type: 'deadlineExtended',
        id: id as string,
        triggeredBy: req.userId,
      });
      logger.debug(`Sent email notification for deadline extension`, { id });
    }

    logger.info(`Listing Updation API Fully Successful with ID: ${id}`);

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
