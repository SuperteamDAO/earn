import { franc } from 'franc';
import type { NextApiResponse } from 'next';

import { BONUS_REWARD_POSITION } from '@/constants';
import {
  checkListingSponsorAuth,
  type NextApiRequestWithSponsor,
  withSponsorAuth,
} from '@/features/auth';
import { sendEmailNotification } from '@/features/emails';
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
  'timeToComplete',
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
];

async function bounty(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  const { id } = req.query;

  const data = req.body;
  const updatedData = filterAllowedFields(data, allowedFields);

  logger.debug(`Request query: ${safeStringify(req.query)}`);
  logger.debug(`Request body: ${safeStringify(req.body)}`);

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

    const {
      rewards,
      rewardAmount,
      token,
      maxRewardAsk,
      minRewardAsk,
      compensationType,
      description,
      skills,
      status,
    } = updatedData;
    let { isPublished } = updatedData;

    let { maxBonusSpots } = updatedData;

    let publishedAt = listing.publishedAt;
    if (isPublished && !listing.publishedAt) {
      publishedAt = new Date();
    }

    const type = updatedData.type || listing.type;
    if (
      ('isPublished' in updatedData && isPublished) ||
      (listing.isPublished &&
        ('rewards' in updatedData ||
          'rewardAmount' in updatedData ||
          'token' in updatedData ||
          'maxBonusSpots' in updatedData ||
          'minRewardAsk' in updatedData ||
          'maxRewardAsk' in updatedData ||
          'compensationType' in updatedData))
    ) {
      if ('token' in updatedData && !token) {
        return res.status(400).json({ error: 'Please select a valid token' });
      }

      if (type === 'project') {
        const finalCompensationType =
          compensationType || listing.compensationType;
        const finalRewardAmount = rewardAmount ?? listing.rewardAmount;
        const finalMinRewardAsk = minRewardAsk ?? listing.minRewardAsk;
        const finalMaxRewardAsk = maxRewardAsk ?? listing.maxRewardAsk;

        if ('compensationType' in updatedData && !finalCompensationType) {
          return res
            .status(400)
            .json({ error: 'Please add a compensation type' });
        }

        if (
          finalCompensationType === 'fixed' &&
          'rewardAmount' in updatedData &&
          !finalRewardAmount
        ) {
          return res.status(400).json({
            error: 'Please specify the total reward amount to proceed',
          });
        }

        if (finalCompensationType === 'range') {
          const isUpdatingRange =
            'minRewardAsk' in updatedData || 'maxRewardAsk' in updatedData;
          if (isUpdatingRange && (!finalMinRewardAsk || !finalMaxRewardAsk)) {
            return res.status(400).json({
              error:
                'Please specify your preferred minimum and maximum compensation range',
            });
          }
          if (isUpdatingRange && finalMaxRewardAsk <= finalMinRewardAsk) {
            return res.status(400).json({
              error:
                'The compensation range is incorrect; the maximum must be higher than the minimum',
            });
          }
        }
      } else {
        const finalRewards = rewards || listing.rewards;

        if ('rewards' in updatedData && finalRewards) {
          if (BONUS_REWARD_POSITION in finalRewards) {
            if (finalRewards[BONUS_REWARD_POSITION] === 0) {
              return res.status(400).json({
                error: "Bonus per prize can't be 0",
              });
            }
            if (finalRewards[BONUS_REWARD_POSITION] < 0.01) {
              return res.status(400).json({
                error: "Bonus per prize can't be less than 0.01",
              });
            }
          }

          const prizePositions = Object.keys(finalRewards)
            .filter((key) => key !== BONUS_REWARD_POSITION.toString())
            .map(Number);

          for (let i = 1; i <= prizePositions.length; i++) {
            if (
              !prizePositions.includes(i) ||
              !finalRewards[i] ||
              isNaN(finalRewards[i])
            ) {
              return res.status(400).json({
                error: 'Please fill all podium ranks or remove unused',
              });
            }
          }
        }
      }
    }

    const pastDeadline = isDeadlineOver(listing?.deadline || undefined);
    const wasUnPublished =
      listing.status === 'OPEN' &&
      listing.isPublished === false &&
      pastDeadline;

    if (
      (wasUnPublished ||
        listing.status === 'CLOSED' ||
        listing.status === 'VERIFYING' ||
        listing.status === 'VERIFY_FAIL') &&
      req.role !== 'GOD'
    )
      return res.status(400).json({
        message: `Listing is not open and hence cannot be edited`,
      });

    if (listing.maxBonusSpots > 0 && typeof maxBonusSpots === 'undefined') {
      maxBonusSpots = 0;
    }

    let language = '';
    if (description) {
      language = franc(description);
      // both 'eng' and 'sco' are english listings
    } else {
      language = 'eng';
    }

    const skillsToUpdate =
      'skills' in updatedData ? (skills ? cleanSkills(skills) : []) : undefined;

    const newRewardsCount = Object.keys(rewards || {}).length;
    const currentTotalWinners = listing.totalWinnersSelected
      ? listing.totalWinnersSelected - (maxBonusSpots ?? 0)
      : 0;

    if (newRewardsCount < currentTotalWinners) {
      updatedData.totalWinnersSelected = newRewardsCount;

      for (
        let position = newRewardsCount + 1;
        position <= currentTotalWinners;
        position++
      ) {
        logger.debug(
          `Resetting winner position: ${position} for listing ID: ${id} `,
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

    if (maxBonusSpots < listing.maxBonusSpots) {
      const bonusSubmissionsToUpdate = await prisma.submission.findMany({
        where: {
          listingId: id as string,
          isWinner: true,
          winnerPosition: BONUS_REWARD_POSITION,
        },
        select: { id: true },
        take: listing.maxBonusSpots - maxBonusSpots,
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

    const sponsor = await prisma.sponsors.findUnique({
      where: { id: userSponsorId },
      select: { isCaution: true, isVerified: true, st: true },
    });

    let isVerifying = listing.status === 'VERIFYING';
    if (isPublished) {
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
            select: {
              id: true,
            },
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
    let amount;
    if (isPublished && publishedAt && !isVerifying) {
      try {
        if (compensationType === 'fixed') {
          amount = rewardAmount;
        } else if (compensationType === 'range') {
          amount = (maxRewardAsk + minRewardAsk) / 2;
        }
        if (token && amount) {
          const tokenUsdValue = await fetchTokenUSDValue(token, publishedAt);
          usdValue = tokenUsdValue * amount;
        }
      } catch (err) {
        logger.error('Error calculating USD value -', err);
      }
    }

    const isFndnPaying =
      sponsor?.st && type !== 'project' ? data.isFndnPaying : false;

    const result = await prisma.bounties.update({
      where: { id: id as string },
      data: {
        ...updatedData,
        status: isVerifying ? 'VERIFYING' : status || listing?.status || 'OPEN',
        rewards,
        rewardAmount,
        token,
        maxRewardAsk,
        minRewardAsk,
        maxBonusSpots,
        compensationType,
        isPublished,
        publishedAt,
        usdValue,
        language,
        isFndnPaying,
        ...(skillsToUpdate !== undefined && { skills: skillsToUpdate }),
      },
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
        console.log('Failed to send Verification Message to discord', err);
        logger.error('Failed to send Verification Message to discord', err);
      }
    } else {
      try {
        if (listing.isPublished === true && result.isPublished === false) {
          await earncognitoClient.post(`/discord/listing-update`, {
            listingId: result.id,
            status: 'Unpublished',
          });
        }
        if (listing.isPublished === false && result.isPublished === true) {
          await earncognitoClient.post(`/discord/listing-update`, {
            listingId: result.id,
            status: 'Published',
          });
        }
      } catch (err) {
        logger.error('Discord Listing Update Message Error', err);
      }
    }

    logger.info(`Bounty with ID: ${id} updated successfully`);
    logger.debug(`Updated bounty data: ${safeStringify(result)} `);

    const deadlineChanged =
      listing.deadline?.toString() !== result.deadline?.toString();
    if (deadlineChanged && result.isPublished && userId) {
      const dayjsDeadline = dayjs(result.deadline);
      logger.debug(
        `Creating comment for deadline extension for listing ID: ${result.id} `,
      );
      await prisma.comment.create({
        data: {
          message: `The deadline for this listing has been updated to ${dayjsDeadline.format('h:mm A, MMMM D, YYYY (UTC)')} `,
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

    return res.status(200).json(result);
  } catch (error: any) {
    logger.error(
      `Error occurred while updating bounty with id = ${id}: ${safeStringify(error)} `,
    );
    return res.status(400).json({
      error: error.message,
      message: `Error occurred while updating bounty with id = ${id}.`,
    });
  }
}

export default withSponsorAuth(bounty);
