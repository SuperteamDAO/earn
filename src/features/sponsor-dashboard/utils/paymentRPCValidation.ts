import {
  clusterApiUrl,
  Connection,
  LAMPORTS_PER_SOL,
  type VersionedTransactionResponse,
} from '@solana/web3.js';

import { type Token } from '@/constants/tokenList';
import logger from '@/lib/logger';

interface ValidatePaymentParams {
  txId: string;
  recipientPublicKey: string;
  expectedAmount: number;
  tokenMint: Token;
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
  tokenMint,
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

    if (meta.err) {
      return {
        isValid: false,
        error: 'Transaction Errored on chain',
      };
    }

    const isNativeSol = isNativeSolTransfer(tx);
    if (isNativeSol) {
      if (tokenMint.tokenSymbol !== 'SOL') {
        return {
          isValid: false,
          error: "Transferred token doesn't match the listing reward token",
        };
      }

      const accountKeys = tx.transaction.message.getAccountKeys();
      let recipientIndex = -1;

      for (let i = 0; i < tx.meta.preBalances.length; i++) {
        const balanceChange =
          (tx.meta.postBalances[i] || 0) - (tx.meta.preBalances[i] || 0);
        if (balanceChange > 0) {
          const accountKey = accountKeys.get(i);
          if (accountKey?.toString() === recipientPublicKey) {
            recipientIndex = i;
            break;
          }
        }
      }

      if (recipientIndex === -1) {
        return {
          isValid: false,
          error: "Receiver's public key doesn't match our records",
        };
      }

      const preBalance = tx.meta.preBalances[recipientIndex];
      const postBalance = tx.meta.postBalances[recipientIndex];

      const actualTransferAmount =
        ((postBalance || 0) - (preBalance || 0)) / LAMPORTS_PER_SOL;

      if (Math.abs(actualTransferAmount - expectedAmount) > 0.000001) {
        return {
          isValid: false,
          error: "Transferred amount doesn't match the amount",
        };
      }

      return { isValid: true };
    }

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

    if (postBalance.mint !== tokenMint.mintAddress) {
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
function isNativeSolTransfer(tx: VersionedTransactionResponse) {
  if (!tx.meta) return false;
  const hasTokenTransfers =
    (tx.meta?.preTokenBalances?.length || 0) > 0 ||
    (tx.meta?.postTokenBalances?.length || 0) > 0;
  if (hasTokenTransfers) return false;

  const accountKeys = tx.transaction.message.getAccountKeys();
  const SYSTEM_PROGRAM_ID = '11111111111111111111111111111111';
  let isSystemProgram = false;
  for (let i = 0; i < accountKeys.length; i++) {
    const key = accountKeys.get(i);
    if (key?.toString() === SYSTEM_PROGRAM_ID) {
      isSystemProgram = true;
      break;
    }
  }
  return isSystemProgram;
}
