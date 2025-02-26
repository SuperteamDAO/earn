import { type Prisma } from '@prisma/client';
import { franc } from 'franc';
import type { NextApiResponse } from 'next';

import earncognitoClient from '@/lib/earncognitoClient';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { cleanSkills } from '@/utils/cleanSkills';
import { dayjs } from '@/utils/dayjs';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithSponsor } from '@/features/auth/types';
import { checkListingSponsorAuth } from '@/features/auth/utils/checkListingSponsorAuth';
import { withSponsorAuth } from '@/features/auth/utils/withSponsorAuth';
import {
  backendListingRefinements,
  createListingFormSchema,
  createListingRefinements,
} from '@/features/listing-builder/types/schema';
import { fetchHistoricalTokenUSDValue } from '@/features/wallet/utils/fetchHistoricalTokenUSDValue';

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
      logger.warn(
        `Listing with id=${listing.id} is already published, hence cannot be published again`,
        {
          id: listing.id,
        },
      );
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
    if (req.body.hackathonId) {
      logger.info(`Listings connected hacakthon is fetched`, {
        listingId: id,
        hackathon: hackathon,
      });
    }

    logger.info('Processing Listings ZOD Validation ', {
      id,
      isGod: user?.role === 'GOD',
      isEditing: false,
      isST: !!sponsor?.st,
      hackathonId: hackathon?.id,
    });
    const listingSchema = createListingFormSchema({
      isGod: user?.role === 'GOD',
      isEditing: false,
      isST: !!sponsor?.st,
      hackathon,
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
    const validatedData = await superValidator.parseAsync(req.body);
    logger.info('Listings ZOD Validation Successful ', {
      id,
      validatedData,
    });

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
    logger.info('Listings Language Detected ', {
      id,
      language,
    });
    const correctedSkills = cleanSkills(skills);
    logger.info('Listings Skills Cleaned ', {
      id,
      previousSkills: skills,
      cleanedSkills: correctedSkills,
    });

    let isVerifying = false;

    if (isPublished && !listing.publishedAt) {
      publishedAt = new Date();
      logger.debug(
        `Checking verification status for sponsor ${userSponsorId} and user ${userId}`,
        {
          sponsorDetails: sponsor,
          userRole: user?.role,
          id,
        },
      );

      if (sponsor && !sponsor.isVerified && user?.role !== 'GOD') {
        logger.info(
          `Processing unverified sponsor checks for sponsor ${userSponsorId}`,
          {
            id,
          },
        );

        // sponsor is sus, be caution
        logger.info(`Processing isCaution check for sponsor ${userSponsorId}`, {
          id,
        });
        isVerifying = sponsor.isCaution;
        logger.debug(`Sponsor isCaution check result: ${isVerifying}`, {
          sponsorId: userSponsorId,
          isCaution: sponsor.isCaution,
          id,
        });

        if (!isVerifying) {
          logger.debug(
            `Checking if sponsor had a live listing with sponsor id ${userSponsorId}`,
            {
              sponsorId: userSponsorId,
              id,
            },
          );
          // sponsor never had a live listing
          const listingCount = await prisma.bounties.count({
            where: {
              sponsorId: userSponsorId,
              isArchived: false,
              isPublished: true,
              isActive: true,
            },
          });
          isVerifying = listingCount === 0;
          logger.debug(`Sponsor live listing check result: ${isVerifying}`, {
            sponsorId: userSponsorId,
            listingCount,
            hadNoLiveListing: listingCount === 0,
            id,
          });
        }

        // sponsor is unverified and latest listing is in review for more than 2 weeks
        if (!isVerifying) {
          const twoWeeksAgo = dayjs().subtract(2, 'weeks');
          logger.debug('Checking for overdue bounties', {
            sponsorId: userSponsorId,
            checkDate: twoWeeksAgo.toISOString(),
            id,
          });

          const overdueListing = await prisma.bounties.findFirst({
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

          isVerifying = !!overdueListing;
          logger.debug(`Overdue listing check result: ${isVerifying}`, {
            sponsorId: userSponsorId,
            hasOverdueListing: !!overdueListing,
            overdueListingId: overdueListing?.id,
            id,
          });
        }
      }
      logger.info(
        `Final verification status for sponsor ${userSponsorId}: ${isVerifying}`,
        {
          id,
          isVerifying,
          sponsorId: userSponsorId,
          reasons: {
            isCautioned: sponsor?.isCaution,
            isUnverified: !sponsor?.isVerified,
            isNotGodUser: user?.role !== 'GOD',
          },
        },
      );
    }

    if (isVerifying) {
      logger.info(`Setting listing to verification mode`, {
        id,
        previousState: { isPublished, publishedAt },
        sponsorId: userSponsorId,
        userId,
      });
      isPublished = false;
      publishedAt = null;
    }
    let usdValue = 0;
    if (isPublished && publishedAt && !isVerifying) {
      logger.info(`Calculating USD value of listing`, {
        id,
        isPublished,
        publishedAt,
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

        if (amount && token) {
          const tokenUsdValue = await fetchHistoricalTokenUSDValue(
            token,
            publishedAt,
          );
          usdValue = tokenUsdValue * amount;
          logger.info('Token USD value fetched', {
            token,
            publishedAt,
            tokenUsdValue,
            calculatedListingUSDValue: usdValue,
          });
        }
      } catch (error) {
        logger.error('Error calculating USD value:', error);
      }
    }

    const isFndnPaying =
      sponsor?.st && type !== 'project' ? rawIsFndnPaying : false;
    logger.info('Is Foundation Paying', {
      isFndnPaying,
      st: sponsor?.st,
      type,
      rawIsFndnPaying,
    });

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
      eligibility: eligibility || undefined,
      rewardAmount,
      rewards: rewards || undefined,
      maxBonusSpots: maxBonusSpots ?? undefined,
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

    logger.debug(`Publishing listing with data: ${safeStringify(data)}`, {
      id,
      data,
    });
    const result = await prisma.bounties.update({
      where: { id },
      data,
    });
    logger.debug(`Publish Listing Successful`, { id });

    if (isVerifying && listing.status !== 'VERIFYING') {
      if (!!listing.sponsor.verificationInfo) {
        logger.info('Sending Discord Verification message', {
          id,
        });
        try {
          if (!process.env.EARNCOGNITO_URL) {
            throw new Error('ENV EARNCOGNITO_URL not provided');
          }
          await earncognitoClient.post(`/discord/verify-listing/initiate`, {
            listingId: result.id,
          });
          logger.info('Sent Discord Verification message', {
            id,
          });
        } catch (err) {
          logger.error('Failed to send Verification Message to discord', err);
        }
      }
    } else {
      try {
        const discordStatus = result.isPublished
          ? 'Published'
          : isVerifying
            ? 'To be Verified'
            : 'Draft Added';
        logger.info('Sending Discord Listing Update message', {
          id,
          discordStatus,
        });
        await earncognitoClient.post(`/discord/listing-update`, {
          listingId: result?.id,
          status: discordStatus,
        });
        logger.info('Sent Discord Listing Update message', {
          id,
        });
      } catch (err) {
        logger.error('Discord Listing Update Message Error', {
          id,
          error,
        });
      }
    }

    logger.info(`Listing Publish API Fully Successful with ID: ${id}`);
    return res.status(200).json(result);
  } catch (error: any) {
    console.log('error', error);
    logger.error(
      `User ${userId} unable to publish a listing: ${safeStringify(error)}`,
    );
    return res.status(400).json({
      error: error.message,
      message: 'Error occurred while publishing a Listing.',
    });
  }
}

export default withSponsorAuth(handler);
