import { type NextApiResponse } from 'next';

import { tokenList } from '@/constants/tokenList';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithSponsor } from '@/features/auth/types';
import { checkListingSponsorAuth } from '@/features/auth/utils/checkListingSponsorAuth';
import { withSponsorAuth } from '@/features/auth/utils/withSponsorAuth';
import {
  type ValidatePaymentResult,
  type VerifyPaymentsFormData,
} from '@/features/sponsor-dashboard/types';
import {
  validatePayment,
  type ValidationResult,
} from '@/features/sponsor-dashboard/utils/paymentRPCValidation';
import { fetchTokenUSDValue } from '@/features/wallet/utils/fetchTokenUSDValue';

async function wait(ms: number) {
  return await new Promise((resolve) => setTimeout(resolve, ms));
}

export const config = {
  maxDuration: 300,
};

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  const userSponsorId = req.userSponsorId;

  try {
    logger.debug(`Request body: ${safeStringify(req.body)}`);
    let { paymentLinks } = req.body as VerifyPaymentsFormData;
    const { listingId } = req.body as VerifyPaymentsFormData & {
      listingId: string;
    };

    paymentLinks = paymentLinks.filter((p) => !!p.link);

    if (!listingId) {
      return res.status(400).json({ error: 'Listing ID is missing' });
    }

    const { error } = await checkListingSponsorAuth(userSponsorId, listingId);
    if (error) {
      return res.status(error.status).json({ error: error.message });
    }

    const listing = await prisma.bounties.findUnique({
      where: {
        id: listingId,
      },
    });
    const submissions = await prisma.submission.findMany({
      where: {
        id: {
          in: paymentLinks.map((d) => d.submissionId),
        },
        isPaid: false,
      },
      include: {
        user: true,
      },
    });

    if (!listing) return res.status(400).json({ error: 'Listing not found' });

    if (!listing.isWinnersAnnounced)
      return res.status(400).json({ error: 'Listing not announced' });

    const dbToken = tokenList.find((t) => t.tokenSymbol === listing.token);
    if (!dbToken) {
      return res
        .status(400)
        .json({ error: "Token doesn't exist for this listing" });
    }

    let tokenPriceUSD: number | undefined;
    try {
      tokenPriceUSD = await fetchTokenUSDValue(dbToken.mintAddress);
    } catch (err) {
      logger.warn(
        `Failed to fetch token price for ${dbToken.tokenSymbol}, falling back to fixed tolerance`,
      );
    }

    const validationResults: ValidatePaymentResult[] = [];

    const txIds = paymentLinks.map((link) => link.txId).filter(Boolean);
    const duplicateTxIds = txIds.filter(
      (txId, index) => txIds.indexOf(txId) !== index,
    );
    if (duplicateTxIds.length > 0) {
      return res.status(400).json({
        error: `Duplicate transaction IDs found: ${duplicateTxIds.join(', ')}`,
      });
    }

    const allExistingTxIds = submissions
      .flatMap((sub) =>
        ((sub.paymentDetails as any[]) || []).map((payment) => payment.txId),
      )
      .filter(Boolean);

    const alreadyUsedTxIds = txIds.filter((txId) =>
      allExistingTxIds.includes(txId),
    );
    if (alreadyUsedTxIds.length > 0) {
      return res.status(400).json({
        error: `Transaction IDs already used: ${alreadyUsedTxIds.join(', ')}`,
      });
    }

    for (const paymentLink of paymentLinks) {
      try {
        logger.debug(
          `Beginning External Payment Verification for submission ID: ${paymentLink.submissionId} with TxId: ${paymentLink.txId}`,
        );

        if (paymentLink.isVerified) {
          validationResults.push({
            submissionId: paymentLink.submissionId,
            txId: paymentLink.txId,
            status: 'ALREADY_VERIFIED',
            message: 'Already Verified',
          });
          continue;
        }

        if (!paymentLink.txId) {
          throw new Error('Invalid URL');
        }

        const submission = submissions.find(
          (s) => s.id === paymentLink.submissionId,
        );
        if (!submission) throw new Error('Submission not found');

        const {
          user: { walletAddress },
          winnerPosition,
        } = submission;

        if (!winnerPosition) {
          logger.error('Submission has no winner position');
          throw new Error('Submission has no winner position');
        }

        const winnerReward = (listing.rewards as Record<string, any>)?.[
          winnerPosition + ''
        ] as number;
        if (!winnerReward) {
          logger.error('Winner Position has no reward');
          throw new Error('Winner Position has no reward');
        }

        const isProject = listing.type === 'project';
        const existingPayments = (submission.paymentDetails as any[]) || [];
        const totalAlreadyPaid = existingPayments.reduce(
          (sum, payment) => sum + payment.amount,
          0,
        );
        const remainingAmount = winnerReward - totalAlreadyPaid;

        if (remainingAmount <= 0) {
          throw new Error('This submission is already fully paid');
        }

        let expectedAmount = winnerReward;
        if (isProject) {
          expectedAmount = 0;
        }

        const rpcValidationResult: ValidationResult = await validatePayment({
          txId: paymentLink.txId,
          recipientPublicKey: walletAddress!,
          expectedAmount,
          tokenMint: dbToken,
          tokenPriceUSD,
        });

        if (!rpcValidationResult.isValid) {
          throw new Error(`Failed (${rpcValidationResult.error})`);
        }

        const actualPaidAmount = isProject
          ? rpcValidationResult.actualAmount || 0
          : winnerReward;

        if (isProject) {
          if (actualPaidAmount <= 0) {
            throw new Error('Invalid payment amount');
          }

          if (actualPaidAmount > remainingAmount) {
            throw new Error(
              `Payment amount (${actualPaidAmount}) exceeds remaining amount (${remainingAmount})`,
            );
          }
        }

        validationResults.push({
          submissionId: paymentLink.submissionId,
          txId: paymentLink.txId,
          status: 'SUCCESS',
          actualAmount: actualPaidAmount,
        });

        logger.info(
          `External Payment Validation Successful for Submission ID: ${paymentLink.submissionId} with TxId: ${paymentLink.txId}`,
        );
        await wait(5000);
      } catch (error: any) {
        validationResults.push({
          submissionId: paymentLink.submissionId,
          txId: paymentLink.txId || '',
          status: 'FAIL',
          message: error.message,
        });
        await wait(5000);
        logger.warn(
          `External Payment Verification Failed for Submission ID: ${paymentLink.submissionId} with TxId: ${paymentLink.txId} with message: ${error.message}`,
        );
      }
    }

    const successfulResultsBySubmission = validationResults
      .filter((result) => result.status === 'SUCCESS')
      .reduce(
        (acc, result) => {
          if (!acc[result.submissionId]) {
            acc[result.submissionId] = [];
          }
          acc[result.submissionId]!.push(result);
          return acc;
        },
        {} as Record<string, ValidatePaymentResult[]>,
      );

    for (const [submissionId, results] of Object.entries(
      successfulResultsBySubmission,
    )) {
      logger.debug(
        `Updating submission with ID: ${submissionId} with ${results.length} new external payment(s)`,
      );

      const submission = submissions.find((s) => s.id === submissionId);
      if (!submission) continue;

      const winnerReward = (listing.rewards as Record<string, any>)?.[
        submission.winnerPosition + ''
      ] as number;

      const isProject = listing.type === 'project';
      const existingPayments = (submission.paymentDetails as any[]) || [];

      const newPayments = results
        .filter(
          (
            result,
          ): result is ValidatePaymentResult & { actualAmount: number } =>
            typeof result.actualAmount === 'number' && result.actualAmount > 0,
        )
        .map((result, i) => ({
          txId: result.txId,
          amount: result.actualAmount,
          tranche: isProject ? existingPayments.length + 1 + i : 1,
        }));

      const allPayments = [...existingPayments, ...newPayments];

      const totalPaidAmount = allPayments.reduce(
        (sum, payment) => sum + payment.amount,
        0,
      );
      const isFullyPaid = totalPaidAmount >= winnerReward;

      await prisma.submission.update({
        where: {
          id: submissionId,
        },
        data: {
          isPaid: isFullyPaid,
          paymentDetails: allPayments,
        },
      });
    }

    return res.status(200).json({ validationResults });
  } catch (err: any) {
    logger.error(
      `Error verifying external payments: ${userSponsorId}: ${err.message}`,
    );
    res.status(400).json({
      err: 'Error verifying external payments: ',
    });
  }
}

export default withSponsorAuth(handler);
