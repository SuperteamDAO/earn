import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { sendEmailNotification } from '@/features/emails';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;

  logger.debug(`Request body: ${safeStringify(req.body)}`);
  const { id, isPaid, paymentDetails } = req.body;

  try {
    logger.debug(`Fetching details for user with ID: ${userId}`);
    const user = await prisma.user.findUnique({
      where: {
        id: userId as string,
      },
    });

    if (!user) {
      logger.warn(`Unauthorized request by user with ID: ${userId}`);
      return res.status(400).json({ error: 'Unauthorized' });
    }

    logger.debug(`Fetching submission with ID: ${id}`);
    const currentSubmission = await prisma.submission.findUnique({
      where: { id },
      include: { listing: true, user: true },
    });

    if (!currentSubmission) {
      logger.warn(`Submission with ID ${id} not found`);
      return res.status(404).json({
        message: `Submission with ID ${id} not found.`,
      });
    }

    if (user.currentSponsorId !== currentSubmission.listing.sponsorId) {
      logger.warn(
        `User with ID ${userId} is not authorized to update submission ${id}`,
      );
      return res.status(403).json({
        message: 'Unauthorized',
      });
    }

    logger.debug(`Updating submission with ID: ${id}`);
    const result = await prisma.submission.update({
      where: {
        id,
      },
      data: {
        isPaid,
        paymentDetails,
      },
    });

    const bountyId = result.listingId;
    const updatedBounty: any = {};

    if (isPaid) {
      updatedBounty.totalPaymentsMade = {
        increment: 1,
      };
      logger.info(
        `Sending payment notification email for submission ID: ${id}`,
      );
      await sendEmailNotification({
        type: 'addPayment',
        id,
        triggeredBy: userId,
      });
    }

    logger.debug(`Updating bounty with ID: ${bountyId}`);
    await prisma.bounties.update({
      where: {
        id: bountyId,
      },
      data: {
        ...updatedBounty,
      },
    });

    logger.info(`Successfully updated submission payment status for ID: ${id}`);
    return res.status(200).json(result);
  } catch (error: any) {
    logger.error(
      `Error updating payment status for submission ${id}: ${safeStringify(
        error,
      )}`,
    );
    return res.status(400).json({
      error: error.message,
      message: `Error occurred while updating payment of a submission ${id}.`,
    });
  }
}

export default withAuth(handler);
