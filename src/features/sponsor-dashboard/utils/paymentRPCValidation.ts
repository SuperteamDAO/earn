import {
  clusterApiUrl,
  Connection,
  type VersionedTransactionResponse,
} from '@solana/web3.js';

import logger from '@/lib/logger';

interface ValidatePaymentParams {
  txId: string;
  recipientPublicKey: string;
  expectedAmount: number;
  tokenMintAddress: string;
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

async function wait(ms: number) {
  return await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function validatePayment({
  txId,
  recipientPublicKey,
  expectedAmount,
  tokenMintAddress,
}: ValidatePaymentParams): Promise<ValidationResult> {
  const connection = new Connection(clusterApiUrl('mainnet-beta'));
  const maxRetries = 3;
  const delayMs = 5000;

  try {
    logger.debug(`Getting Transaction Information from RPC for txId: ${txId}`);

    let tx: VersionedTransactionResponse | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        tx = await connection.getTransaction(txId, {
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 10,
        });
        break;
      } catch (err) {
        if (attempt === maxRetries) {
          throw new Error("Couldn't fetch transaction details");
        }
        await wait(delayMs);
      }
    }

    if (!tx || !tx.meta) {
      return { isValid: false, error: 'Invalid transaction' };
    }

    const { meta } = tx;

    const preBalance = meta.preTokenBalances?.find(
      (balance) => balance.owner === recipientPublicKey,
    );
    const postBalance = meta.postTokenBalances?.find(
      (balance) => balance.owner === recipientPublicKey,
    );

    if (!postBalance) {
      return {
        isValid: false,
        error: "Receiver's public key doesn't match our records",
      };
    }

    if (postBalance.mint !== tokenMintAddress) {
      return {
        isValid: false,
        error: "Transferred token doesn't match the listing reward token",
      };
    }

    const preAmount = preBalance?.uiTokenAmount.uiAmount || 0;
    const postAmount = postBalance.uiTokenAmount.uiAmount;

    if (!postAmount) {
      return {
        isValid: false,
        error: "Transferred amount doesn't match the amount",
      };
    }

    const actualTransferAmount = postAmount - preAmount;
    if (Math.abs(actualTransferAmount - expectedAmount) > 0.000001) {
      return {
        isValid: false,
        error: "Transferred amount doesn't match the amount",
      };
    }

    return { isValid: true };
  } catch (error: any) {
    return { isValid: false, error: error.message };
  }
}
