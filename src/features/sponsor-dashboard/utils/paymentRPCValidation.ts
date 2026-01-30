import { signature } from '@solana/kit';

import { type Token } from '@/constants/tokenList';
import logger from '@/lib/logger';

import { getRpc } from '@/features/wallet/utils/getConnection';

const LAMPORTS_PER_SOL = 1_000_000_000n;
const USD_TOLERANCE_PERCENT = 0.005; // 0.5% tolerance in USD terms

interface ValidatePaymentParams {
  txId: string;
  recipientPublicKey: string;
  expectedAmount: number;
  tokenMint: Token;
  tokenPriceUSD?: number;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  actualAmount?: number;
}

async function wait(ms: number) {
  return await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function validatePayment({
  txId,
  recipientPublicKey,
  expectedAmount,
  tokenMint,
  tokenPriceUSD,
}: ValidatePaymentParams): Promise<ValidationResult> {
  const rpc = getRpc();
  const maxRetries = 3;
  const delayMs = 5000;

  // Calculate allowed deviation: 0.5% of expected amount in USD terms.
  // This is equivalent to 0.5% of the expected token amount, even when USD price is unavailable.
  const getAllowedDifference = (expected: number): number => {
    if (expected <= 0) {
      return 0;
    }
    if (tokenPriceUSD && tokenPriceUSD > 0) {
      const expectedUSD = expected * tokenPriceUSD;
      const toleranceUSD = expectedUSD * USD_TOLERANCE_PERCENT;
      return toleranceUSD / tokenPriceUSD; // Convert back to token amount
    }
    return expected * USD_TOLERANCE_PERCENT;
  };

  try {
    logger.debug(`Getting Transaction Information from RPC for txId: ${txId}`);

    let tx: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        tx = await rpc
          .getTransaction(signature(txId), {
            commitment: 'confirmed',
            maxSupportedTransactionVersion: 0,
            encoding: 'jsonParsed',
          })
          .send();
        break;
      } catch (err) {
        if (attempt === maxRetries) {
          throw new Error("Couldn't fetch transaction details");
        }
        await wait(delayMs);
      }
    }

    if (!tx || !tx.meta) {
      return { isValid: false, error: 'Transaction not found' };
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

      const accountKeys = tx.transaction.message.accountKeys;
      let recipientIndex = -1;

      for (let i = 0; i < tx.meta.preBalances.length; i++) {
        const balanceChange =
          Number(tx.meta.postBalances[i] || 0) -
          Number(tx.meta.preBalances[i] || 0);
        if (balanceChange > 0) {
          const key = accountKeys[i];
          const accountKey =
            typeof key === 'string' ? key : key?.pubkey || String(key);
          if (accountKey === recipientPublicKey) {
            recipientIndex = i;
            break;
          }
        }
      }

      if (recipientIndex === -1) {
        return {
          isValid: false,
          error: "Recipient's public key doesn't match our records",
        };
      }

      const preBalance = BigInt(tx.meta.preBalances[recipientIndex] || 0);
      const postBalance = BigInt(tx.meta.postBalances[recipientIndex] || 0);

      const actualTransferAmount =
        Number(postBalance - preBalance) / Number(LAMPORTS_PER_SOL);

      const allowedDiff = getAllowedDifference(expectedAmount);
      if (
        expectedAmount > 0 &&
        Math.abs(actualTransferAmount - expectedAmount) > allowedDiff
      ) {
        return {
          isValid: false,
          error: "Transferred amount doesn't match the amount",
        };
      }

      return { isValid: true, actualAmount: actualTransferAmount };
    }

    const preBalance = meta.preTokenBalances?.find(
      (balance: { owner?: string }) => balance.owner === recipientPublicKey,
    );
    const postBalance = meta.postTokenBalances?.find(
      (balance: { owner?: string }) => balance.owner === recipientPublicKey,
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

    const preAmount = parseFloat(
      preBalance?.uiTokenAmount?.uiAmountString ?? '0',
    );
    const postAmountStr = postBalance.uiTokenAmount?.uiAmountString;

    if (!postAmountStr) {
      return {
        isValid: false,
        error: "Transferred amount doesn't match the amount",
      };
    }

    const postAmount = parseFloat(postAmountStr);
    const actualTransferAmount = postAmount - preAmount;

    const allowedDiff = getAllowedDifference(expectedAmount);
    if (
      expectedAmount > 0 &&
      Math.abs(actualTransferAmount - expectedAmount) > allowedDiff
    ) {
      return {
        isValid: false,
        error: "Transferred amount doesn't match the amount",
      };
    }

    return { isValid: true, actualAmount: actualTransferAmount };
  } catch (error: any) {
    return { isValid: false, error: error.message };
  }
}

function isNativeSolTransfer(tx: any) {
  if (!tx.meta) return false;
  const hasTokenTransfers =
    (tx.meta?.preTokenBalances?.length || 0) > 0 ||
    (tx.meta?.postTokenBalances?.length || 0) > 0;
  if (hasTokenTransfers) return false;

  const accountKeys = tx.transaction.message.accountKeys;
  const SYSTEM_PROGRAM_ID = '11111111111111111111111111111111';
  let isSystemProgram = false;
  for (let i = 0; i < accountKeys.length; i++) {
    const key = accountKeys[i];
    const keyStr = typeof key === 'string' ? key : key?.pubkey || key;
    if (keyStr === SYSTEM_PROGRAM_ID) {
      isSystemProgram = true;
      break;
    }
  }
  return isSystemProgram;
}
