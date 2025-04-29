import { Prisma } from '@prisma/client';
import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { fetchTokenUSDValue } from '@/utils/fetchTokenUSDValue';

import { type NextApiRequestWithSponsor } from '@/features/auth/types';
import { withSponsorAuth } from '@/features/auth/utils/withSponsorAuth';
import { type Rewards } from '@/features/listings/types';

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  const userId = req.userId;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (req.role !== 'GOD') {
    return res.status(403).json({ error: 'Unauthorized access' });
  }

  logger.debug(`Request body: ${JSON.stringify(req.body)}`);
  const { id, status, label, isPaid, paymentLink } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Submission ID is required' });
  }

  try {
    const currentSubmission = await prisma.submission.findUnique({
      where: { id },
      include: { listing: true },
    });

    if (!currentSubmission) {
      logger.warn(`Submission with ID ${id} not found`);
      return res.status(404).json({
        message: `Submission with ID ${id} not found.`,
      });
    }

    const updateData: Prisma.SubmissionUpdateInput = {};

    if (status) {
      updateData.status = status;
    }

    if (label) {
      updateData.label = label;
    }

    if (currentSubmission.isPaid !== isPaid) {
      updateData.isPaid = isPaid;

      if (isPaid && paymentLink) {
        updateData.paymentDetails = {
          link: paymentLink,
        };
        updateData.paymentDate = new Date();
      }
    }

    const isRevertingFromApproved =
      currentSubmission.status === 'Approved' &&
      updateData.status &&
      updateData.status !== 'Approved';

    if (isRevertingFromApproved) {
      updateData.isPaid = false;
      updateData.paymentDetails = Prisma.JsonNull;
      updateData.paymentDate = null;
      updateData.winnerPosition = null;
    }

    const result = await prisma.submission.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: { listing: true },
    });

    const oldRewards = currentSubmission.listing.rewards as Record<
      string,
      number
    >;
    if (isRevertingFromApproved) {
      const listing = currentSubmission.listing;

      if (listing.compensationType !== 'fixed' && currentSubmission.ask) {
        if (currentSubmission.winnerPosition) {
          const position = currentSubmission.winnerPosition.toString();
          const { [position]: removed, ...remainingRewards } = oldRewards;
          logger.debug(`Removed reward: ${removed}`);
          logger.debug(
            `Remaining rewards: ${JSON.stringify(remainingRewards)}`,
          );

          await prisma.bounties.update({
            where: { id: listing.id },
            data: {
              rewards: remainingRewards,
              usdValue: { decrement: currentSubmission.rewardInUSD },
              totalWinnersSelected: { decrement: 1 },
              updatedAt: new Date(),
            },
          });
        }
      }
    } else if (
      status === 'Approved' &&
      currentSubmission.status !== 'Approved'
    ) {
      if (currentSubmission.listing.compensationType !== 'fixed') {
        logger.debug('Fetching token USD value for variable compensation');
        const tokenUSDValue =
          currentSubmission.listing.token === 'Any'
            ? 1
            : await fetchTokenUSDValue(
                currentSubmission.listing.token!,
                currentSubmission.listing.publishedAt!,
              );
        const usdValue = tokenUSDValue * (currentSubmission.ask || 0);
        const maxPosition = await prisma.submission.count({
          where: { listingId: currentSubmission.listingId, isWinner: true },
        });

        await prisma.bounties.update({
          where: { id: currentSubmission.listingId },
          data: {
            rewards: {
              ...(oldRewards as Rewards),
              [maxPosition]: currentSubmission.ask,
            },
            rewardAmount: currentSubmission.ask,
            usdValue: { increment: usdValue },
            updatedAt: new Date(),
          },
        });

        await prisma.submission.update({
          where: { id },
          data: {
            winnerPosition: maxPosition,
            updatedAt: new Date(),
          },
        });
      }
    }

    if (isPaid !== undefined && isPaid !== currentSubmission.isPaid) {
      await prisma.bounties.update({
        where: { id: currentSubmission.listingId },
        data: {
          totalPaymentsMade: isPaid ? { increment: 1 } : { decrement: 1 },
        },
      });
    }

    logger.info(`Successfully updated submission status with ID: ${id}`);
    return res.status(200).json({
      message: 'Success',
      submission: result,
    });
  } catch (error: any) {
    logger.error(
      `User ${userId} unable to edit submission status: ${error.message}`,
    );
    return res.status(400).json({
      error: error.message,
      message: `Error occurred while updating submission ${id}.`,
    });
  }
}

export default withSponsorAuth(handler);
