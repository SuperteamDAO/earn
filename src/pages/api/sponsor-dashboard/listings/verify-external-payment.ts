import { type NextApiResponse } from 'next';

import { tokenList } from '@/constants';
import {
  checkListingSponsorAuth,
  type NextApiRequestWithSponsor,
  withSponsorAuth,
} from '@/features/auth';
import {
  validatePayment,
  type ValidatePaymentResult,
  type VerifyPaymentsFormData,
} from '@/features/sponsor-dashboard';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

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

    const validationResults: ValidatePaymentResult[] = [];

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
          user: { publicKey },
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

        const validationResult = await validatePayment({
          txId: paymentLink.txId,
          recipientPublicKey: publicKey!,
          expectedAmount: winnerReward,
          tokenMintAddress: dbToken.mintAddress,
        });

        if (!validationResult.isValid) {
          throw new Error(`Failed (${validationResult.error})`);
        }
        validationResults.push({
          submissionId: paymentLink.submissionId,
          txId: paymentLink.txId,
          status: 'SUCCESS',
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

    for (const validationResult of validationResults) {
      if (validationResult.status !== 'SUCCESS') continue;

      logger.debug(
        `Updating submission with ID: ${validationResult.submissionId} with new external payment details`,
      );
      await prisma.submission.update({
        where: {
          id: validationResult.submissionId,
        },
        data: {
          isPaid: true,
          paymentDetails: { txId: validationResult.txId },
        },
      });
    }

    logger.debug(
      `Updating listing with ID: ${listingId} with new totalPaymentsMade`,
    );
    await prisma.bounties.update({
      where: {
        id: listingId,
      },
      data: {
        totalPaymentsMade: {
          increment: validationResults.filter((r) => r.status === 'SUCCESS')
            .length,
        },
      },
    });

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
