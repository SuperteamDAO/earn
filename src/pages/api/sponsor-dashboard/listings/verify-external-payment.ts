import { getMint } from '@solana/spl-token';
import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';
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

interface TransactionDetail {
  submissionId: string;
  txId: string;
  sender: string;
  receiver: string;
  token: string;
  amount: number;
}

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  const userSponsorId = req.userSponsorId;

  try {
    const connection = new Connection(clusterApiUrl('mainnet-beta'));

    logger.debug(`Request body: ${safeStringify(req.body)}`);
    const { paymentLinks, listingId } = req.body as VerifyPaymentsFormData & {
      listingId: string;
    };
    const details: TransactionDetail[] = [];

    if (!listingId) {
      return res.status(400).json({ error: 'Listing ID is missing' });
    }

    const { error } = await checkListingSponsorAuth(userSponsorId, listingId);
    if (error) {
      return res.status(error.status).json({ error: error.message });
    }

    const validationResults: ValidatePaymentResult[] = [];

    for (const paymentLink of paymentLinks) {
      try {
        logger.debug(
          `Beginning External Payment Verification for submission ID: ${paymentLink.submissionId} with TxId: ${paymentLink.txId}`,
        );
        if (!paymentLink.txId) {
          throw new Error('Transaction ID is missing');
        }

        logger.debug(
          `Getting Parsed Transaction for txId: ${paymentLink.txId}`,
        );
        const tx = await connection.getParsedTransaction(paymentLink.txId, {
          commitment: 'confirmed',
        });

        if (!tx) {
          throw new Error('Transaction not found');
        }

        const { transaction } = tx;
        const { message } = transaction;

        const sender = message?.accountKeys[0]?.pubkey.toBase58();
        let receiver = '';
        let tokenMintAddr = '';
        let amount = 0;

        for (const instruction of tx.transaction.message.instructions) {
          if ('parsed' in instruction) {
            const parsed = instruction.parsed;
            if (parsed.type.includes('transferChecked')) {
              receiver = parsed.info.destination;
              amount = parsed.info.tokenAmount.uiAmount;

              const mint = new PublicKey(parsed.info.mint);

              const mintAccount = await getMint(connection, mint);

              tokenMintAddr = mintAccount.address.toBase58();
            }
          }
        }

        details.push({
          submissionId: paymentLink.submissionId,
          txId: paymentLink.txId,
          sender: sender || '',
          receiver,
          token: tokenMintAddr,
          amount: amount,
        });
        logger.info(
          `Transaction Information Fetch Successfully for TxID: ${paymentLink.txId}`,
        );
      } catch (error: any) {
        validationResults.push({
          submissionId: paymentLink.submissionId,
          txId: paymentLink.txId || '',
          status: 'FAIL',
          message: error.message,
        });

        logger.warn(
          `External Payment Verification Failed for Submission ID: ${paymentLink.submissionId} with TxId: ${paymentLink.txId} with message: ${error.message}`,
        );
      }
    }

    const listing = await prisma.bounties.findUnique({
      where: {
        id: listingId,
      },
    });
    const submissions = await prisma.submission.findMany({
      where: {
        id: {
          in: details.map((d) => d.submissionId),
        },
        isPaid: false,
      },
      include: {
        user: true,
      },
    });

    if (!listing) return res.status(400).json({ error: 'Listing not found' });

    for (const detail of details) {
      const submission = submissions.find((s) => s.id === detail.submissionId);
      if (!submission) throw new Error('Submission not found');
      const { user, winnerPosition } = submission;
      const { amount, token, txId, submissionId, receiver } = detail;
      try {
        logger.debug(
          `Beginning External Payment Validation for submission ID: ${submissionId} with TxId: ${txId}`,
        );
        if (!winnerPosition) {
          throw new Error('Submission has no winner position');
        }

        const winnerReward = (listing.rewards as Record<string, any>)?.[
          winnerPosition + ''
        ] as number | null | undefined;
        if (!winnerReward) {
          throw new Error('Winner Position has no reward');
        }

        const parsedToken = tokenList.find((t) => t.mintAddress === token);
        const dbToken = tokenList.find((t) => t.tokenSymbol === listing.token);
        if (parsedToken?.mintAddress !== dbToken?.mintAddress) {
          throw new Error('Listing Token and Transaction Token do not match');
        }

        if (amount !== winnerReward) {
          throw new Error(
            `Amount in transaction does not match reward in listing`,
          );
        }

        if (receiver !== user.publicKey) {
          throw new Error('Receiver address does not match');
        }

        validationResults.push({
          submissionId,
          txId,
          status: 'SUCCESS',
        });

        logger.debug(
          `External Payment Validation Successful for submission ID: ${submissionId} with TxId: ${txId}`,
        );
      } catch (error: any) {
        logger.warn(
          `External Payment Validation Failed for Submission ID: ${submissionId} with TxId: ${txId} with message: ${error.message}`,
        );
        validationResults.push({
          submissionId,
          txId,
          status: 'FAIL',
          message: error.message,
        });
      }
    }

    for (const validationResult of validationResults) {
      if (validationResult.status === 'FAIL') continue;

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
