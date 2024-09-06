import {
  clusterApiUrl,
  Connection,
  type VersionedTransactionResponse,
} from '@solana/web3.js';
import { type NextApiResponse } from 'next';

import { tokenList } from '@/constants';
import {
  checkListingSponsorAuth,
  type NextApiRequestWithSponsor,
  withSponsorAuth,
} from '@/features/auth';
import {
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
    const connection = new Connection(clusterApiUrl('mainnet-beta'));

    logger.debug(`Request body: ${safeStringify(req.body)}`);
    const { paymentLinks, listingId } = req.body as VerifyPaymentsFormData & {
      listingId: string;
    };

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
        ] as number | null | undefined;
        if (!winnerReward) {
          logger.error('Winner Position has no reward');
          throw new Error('Winner Position has no reward');
        }

        const dbToken = tokenList.find((t) => t.tokenSymbol === listing.token);
        if (!dbToken) {
          logger.error(`Token doesn't exist for this listing`);
          throw new Error(`Token doesn't exist for this listing`);
        }

        logger.debug(
          `Getting Transaction Information from RPC for txId: ${paymentLink.txId}`,
        );
        let tx: VersionedTransactionResponse | null = null;
        const maxRetries = 3;
        const delayMs = 5000;

        try {
          for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
              tx = await connection.getTransaction(paymentLink.txId, {
                commitment: 'confirmed',
                maxSupportedTransactionVersion: 10,
              });
              break;
            } catch (err) {
              if (attempt === maxRetries) {
                throw err;
              }
              await wait(delayMs);
            }
          }
        } catch (err) {
          throw new Error(`Failed (Couldn't fetch transaction details)`);
        }

        if (!tx) {
          throw new Error('Failed (Invalid URL)');
        }

        const { meta } = tx;

        if (!meta) {
          throw new Error(`Failed (Invalid URL)`);
        }

        const preBalance = meta?.preTokenBalances?.find(
          (balance) => balance.owner === publicKey,
        );
        const postBalance = meta?.postTokenBalances?.find(
          (balance) => balance.owner === publicKey,
        );
        if (!postBalance) {
          throw new Error(
            `Failed (Receiver’s public key doesn’t match our records.)`,
          );
        }

        if (postBalance.mint !== dbToken?.mintAddress) {
          throw new Error(
            `Failed (Transferred token doesn't match the token.)`,
          );
        }

        const preAmount = preBalance?.uiTokenAmount.uiAmount || 0;
        const postAmount = postBalance.uiTokenAmount.uiAmount;
        if (!postAmount) {
          throw new Error(
            `Failed (Transferred amount doesn’t match the amount)`,
          );
        }
        const actualTransferAmount = postAmount - preAmount;
        if (Math.abs(actualTransferAmount - winnerReward) > 0.000001) {
          // Using small epsilon for float comparison
          throw new Error(
            `Failed (Transferred amount doesn’t match the amount)`,
          );
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
