import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { getTokenBySymbol } from '@/server/tokenList';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithSponsor } from '@/features/auth/types';
import { checkGrantSponsorAuth } from '@/features/auth/utils/checkGrantSponsorAuth';
import { withSponsorAuth } from '@/features/auth/utils/withSponsorAuth';
import { queueEmail } from '@/features/emails/utils/queueEmail';
import {
  findUsedPaymentTxIds,
  normalizePaymentTxId,
} from '@/features/sponsor-dashboard/utils/paymentReplayCheck';
import { validatePayment } from '@/features/sponsor-dashboard/utils/paymentRPCValidation';
import { fetchTokenUSDValue } from '@/features/wallet/utils/fetchTokenUSDValue';

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  const { id, trancheAmount, txId = '' } = req.body;
  const parsedTrancheAmount = Number(trancheAmount);

  const userId = req.userId;
  const userSponsorId = req.userSponsorId;

  logger.debug(`Request body: ${safeStringify(req.body)}`);

  if (!id || trancheAmount === undefined || trancheAmount === null || !txId) {
    logger.warn('Missing required body parameters: id, trancheAmount, or txId');
    return res.status(400).json({
      error: 'Missing required body parameters: id, trancheAmount, or txId',
    });
  }

  if (!Number.isFinite(parsedTrancheAmount) || parsedTrancheAmount <= 0) {
    return res.status(400).json({
      error: 'trancheAmount must be a positive finite number',
    });
  }

  try {
    logger.info(`Fetching grant application with ID: ${id}`);
    const currentApplication = await prisma.grantApplication.findUnique({
      where: { id },
      include: { grant: true },
    });

    if (!currentApplication) {
      logger.info(`Grant application not found with ID: ${id}`);
      return res.status(404).json({ error: 'Grant application not found' });
    }

    const { error } = await checkGrantSponsorAuth(
      userSponsorId,
      currentApplication.grantId,
    );

    if (error) {
      return res.status(error.status).json({ error: error.message });
    }

    const remainingAmount =
      currentApplication.approvedAmount - currentApplication.totalPaid;
    if (parsedTrancheAmount > remainingAmount) {
      return res.status(400).json({
        error: `Tranche amount exceeds remaining approved amount (${remainingAmount})`,
      });
    }

    const normalizedTxId = normalizePaymentTxId(txId);
    const alreadyUsedTxIds = await findUsedPaymentTxIds([normalizedTxId]);
    if (alreadyUsedTxIds.length > 0) {
      return res.status(400).json({
        error: `Transaction IDs already used: ${alreadyUsedTxIds.join(', ')}`,
      });
    }

    const dbToken = await getTokenBySymbol(currentApplication.grant.token);
    if (!dbToken) {
      return res.status(400).json({
        error: "Token doesn't exist for this grant",
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

    const validationResult = await validatePayment({
      txId: normalizedTxId,
      recipientPublicKey: currentApplication.walletAddress,
      expectedAmount: parsedTrancheAmount,
      tokenMint: dbToken,
      tokenPriceUSD,
    });

    if (!validationResult.isValid) {
      return res.status(400).json({
        error: validationResult.error,
        message: `Transaction validation failed: ${validationResult.error}`,
      });
    }

    let updatedPaymentDetails = currentApplication.paymentDetails || [];
    if (!Array.isArray(updatedPaymentDetails)) {
      updatedPaymentDetails = [];
    }

    updatedPaymentDetails.push({
      txId: txId || null,
      tranche: currentApplication.totalTranches + 1,
      amount: parsedTrancheAmount,
    });

    const newTotalPaid = currentApplication.totalPaid + parsedTrancheAmount;
    const isFullyPaid = newTotalPaid >= currentApplication.approvedAmount;

    logger.info('Updating payment details and grant information');
    const result = await prisma.$transaction(async (tx) => {
      const updatedGrantApplication = await tx.grantApplication.update({
        where: { id },
        data: {
          totalPaid: {
            increment: parsedTrancheAmount,
          },
          totalTranches: {
            increment: 1,
          },
          paymentDetails: updatedPaymentDetails as any,
          ...(isFullyPaid && { applicationStatus: 'Completed' }),
        },
        include: {
          user: true,
          grant: true,
        },
      });

      return updatedGrantApplication;
    });

    await queueEmail({
      type: 'grantPaymentReceived',
      id,
      triggeredBy: userId,
      userId: currentApplication.userId,
    });

    logger.info(
      `Payment details updated successfully for grant application ID: ${id}`,
    );
    return res.status(200).json(result);
  } catch (error: any) {
    logger.error(
      `Error occurred while updating payment for grant application ID: ${id}`,
      safeStringify(error),
    );
    return res.status(400).json({
      error: error.message,
      message: `Error occurred while updating payment of a submission ${id}.`,
    });
  }
}

export default withSponsorAuth(handler);
