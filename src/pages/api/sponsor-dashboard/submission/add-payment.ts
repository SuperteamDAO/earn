import type { NextApiResponse } from 'next';

import { tokenList } from '@/constants/tokenList';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithSponsor } from '@/features/auth/types';
import { checkListingSponsorAuth } from '@/features/auth/utils/checkListingSponsorAuth';
import { withSponsorAuth } from '@/features/auth/utils/withSponsorAuth';
import { queueEmail } from '@/features/emails/utils/queueEmail';
import { validatePayment } from '@/features/sponsor-dashboard/utils/paymentRPCValidation';
import { fetchTokenUSDValue } from '@/features/wallet/utils/fetchTokenUSDValue';

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  const userId = req.userId;

  logger.debug(`Request body: ${safeStringify(req.body)}`);
  const { id, paymentDetails } = req.body;

  if (
    !paymentDetails ||
    !Array.isArray(paymentDetails) ||
    paymentDetails.length === 0
  ) {
    logger.warn('Payment details array is required');
    return res.status(400).json({
      error: 'Payment details array is required',
      message: 'Payment details array is required',
    });
  }

  const paymentDetail = paymentDetails[0];
  if (
    !paymentDetail?.txId ||
    !paymentDetail?.amount ||
    typeof paymentDetail?.tranche !== 'number'
  ) {
    logger.warn('Invalid payment details structure');
    return res.status(400).json({
      error: 'Invalid payment details: txId, amount, and tranche are required',
      message:
        'Invalid payment details: txId, amount, and tranche are required',
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

    const isProject = listing.type === 'project';
    if (!isProject) {
      if (paymentDetails.length > 1 || paymentDetail.tranche !== 1) {
        logger.warn('Bounties only support single payment with tranche 1');
        return res.status(400).json({
          error: 'Bounties only support single payment with tranche 1',
          message: 'Bounties only support single payment with tranche 1',
        });
      }
    } else {
      const existingPayments =
        (currentSubmission.paymentDetails as any[]) || [];
      const existingTranches = existingPayments.map((p) => p.tranche);
      const newTranche = paymentDetail.tranche;
      const expectedNextTranche = existingTranches.length + 1;

      if (newTranche !== expectedNextTranche) {
        logger.warn(
          `Project tranche ${newTranche} is not the expected next tranche ${expectedNextTranche}`,
        );
        return res.status(400).json({
          error: `Expected tranche ${expectedNextTranche}, but received tranche ${newTranche}`,
          message: `Expected tranche ${expectedNextTranche}, but received tranche ${newTranche}`,
        });
      }
    }

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

    let tokenPriceUSD: number | undefined;
    try {
      tokenPriceUSD = await fetchTokenUSDValue(dbToken.mintAddress);
    } catch (err) {
      logger.warn(
        `Failed to fetch token price for ${dbToken.tokenSymbol}, falling back to fixed tolerance`,
      );
    }

    logger.debug(`Validating transaction for submission ID: ${id}`);
    const validationResult = await validatePayment({
      txId: paymentDetail.txId,
      recipientPublicKey: user.walletAddress!,
      expectedAmount: paymentDetail.amount,
      tokenMint: dbToken,
      tokenPriceUSD,
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

    const finalPaymentDetails = isProject
      ? [
          ...((currentSubmission.paymentDetails as any[]) || []),
          ...paymentDetails,
        ]
      : paymentDetails;

    const totalAllPayments = finalPaymentDetails.reduce(
      (sum, payment) => sum + payment.amount,
      0,
    );
    const isFullyPaid = totalAllPayments >= winnerReward;

    logger.debug(`Updating submission with ID: ${id}`);
    const result = await prisma.submission.update({
      where: {
        id,
      },
      data: {
        isPaid: isFullyPaid,
        paymentDetails: finalPaymentDetails,
      },
    });

    const bountyId = result.listingId;
    const updatedBounty: any = {};

    logger.info(`Sending payment notification email for submission ID: ${id}`);
    await queueEmail({
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
