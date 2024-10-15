import type { NextApiResponse } from 'next';

import {
  checkListingSponsorAuth,
  type NextApiRequestWithSponsor,
  withSponsorAuth,
} from '@/features/auth';
import { sendEmailNotification } from '@/features/emails';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  const userId = req.userId;

  logger.debug(`Request body: ${safeStringify(req.body)}`);
  const { id, isPaid, paymentDetails } = req.body;

  if (!paymentDetails || paymentDetails.length === 0 || !isPaid) {
    logger.warn('Payment details are required');
    res.status(400).json({
      error: 'Payment details are required',
      message: 'Payment details are required',
    });
  }

  try {
    const currentSubmission = await prisma.submission.findUnique({
      where: { id },
    });

    if (!currentSubmission) {
      logger.warn(`Submission with ID ${id} not found`);
      return res.status(404).json({
        message: `Submission with ID ${id} not found.`,
      });
    }

    const userSponsorId = req.userSponsorId;

    const { error } = await checkListingSponsorAuth(
      userSponsorId,
      currentSubmission.listingId,
    );
    if (error) {
      return res.status(error.status).json({ error: error.message });
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

    updatedBounty.totalPaymentsMade = {
      increment: 1,
    };
    logger.info(`Sending payment notification email for submission ID: ${id}`);
    sendEmailNotification({
      type: 'addPayment',
      id,
      triggeredBy: userId,
    });

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

export default withSponsorAuth(handler);
