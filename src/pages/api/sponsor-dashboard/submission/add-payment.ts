import type { NextApiResponse } from 'next';

import { tokenList } from '@/constants';
import {
  checkListingSponsorAuth,
  type NextApiRequestWithSponsor,
  withSponsorAuth,
} from '@/features/auth';
import { sendEmailNotification } from '@/features/emails';
import { validatePayment } from '@/features/sponsor-dashboard';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  const userId = req.userId;

  logger.debug(`Request body: ${safeStringify(req.body)}`);
  const { id, isPaid, paymentDetails } = req.body;

  if (!paymentDetails || paymentDetails.length === 0 || !isPaid) {
    logger.warn('Payment details are required');
    return res.status(400).json({
      error: 'Payment details are required',
      message: 'Payment details are required',
    });
  }

  try {
    const currentSubmission = await prisma.submission.findUnique({
      where: { id },
      include: {
        user: true,
        listing: true,
      },
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

    const { listing, user, winnerPosition } = currentSubmission;
    if (!winnerPosition) {
      return res.status(400).json({
        error: 'Submission has no winner position',
        message: 'Submission has no winner position',
      });
    }

    const winnerReward = (listing.rewards as Record<string, any>)?.[
      winnerPosition + ''
    ] as number;
    if (!winnerReward) {
      return res.status(400).json({
        error: 'Winner position has no reward',
        message: 'Winner position has no reward',
      });
    }

    const dbToken = tokenList.find((t) => t.tokenSymbol === listing.token);
    if (!dbToken) {
      return res.status(400).json({
        error: "Token doesn't exist for this listing",
        message: "Token doesn't exist for this listing",
      });
    }

    logger.debug(`Validating transaction for submission ID: ${id}`);
    const validationResult = await validatePayment({
      txId: paymentDetails.txId,
      recipientPublicKey: user.publicKey!,
      expectedAmount: winnerReward,
      tokenMintAddress: dbToken.mintAddress,
    });

    if (!validationResult.isValid) {
      logger.warn(
        `Transaction validation failed for submission ID: ${id}: ${validationResult.error}`,
      );
      return res.status(400).json({
        error: validationResult.error,
        message: `Transaction validation failed: ${validationResult.error}`,
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
