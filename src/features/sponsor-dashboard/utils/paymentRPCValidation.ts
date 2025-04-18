import { type FinalExecutionOutcome } from '@near-js/types';
import * as nearApi from 'near-api-js';

import { type Token } from '@/constants/tokenList';
import logger from '@/lib/logger';
import { formatTokenAmount, getTransactionStatus } from '@/utils/near';

interface ValidatePaymentParams {
  txId: string;
  recipientPublicKey: string;
  expectedAmount: number;
  tokenMint: Token;
  isUSDbased: boolean;
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
  transactionDate?: Date;
}

/// isUSDbased is true if the user specified the token as Any and provided requested amount in US Dollars.
/// Unfortunately, for us, for now, we can't properly validate the payment in USD because we can't know the price of the token at the time of payment.
/// So we just validate that the user received at least some amount of the token.
/// This
export async function validatePayment({
  txId,
  recipientPublicKey,
  expectedAmount,
  tokenMint,
  isUSDbased,
}: ValidatePaymentParams): Promise<ValidationResult> {
  try {
    logger.debug(`Getting Transaction Information from RPC for txId: ${txId}`);
    const tx: FinalExecutionOutcome = await getTransactionStatus(
      recipientPublicKey,
      txId,
    );

    if (!tx) {
      return { isValid: false, error: 'Transaction not found' };
    }

    if (tx.final_execution_status !== 'FINAL') {
      return { isValid: false, error: 'Transaction not finalized yet' };
    }

    if (!tx.receipts) {
      return {
        isValid: false,
        error: 'No receipts found inside the transaction',
      };
    }

    if (tx.transaction_outcome.outcome.status instanceof Object) {
      if (tx.transaction_outcome.outcome.status.Failure !== undefined) {
        return {
          isValid: false,
          error: 'Transaction failed during the execution',
        };
      }
    }

    const isNativeTransfer = tokenMint.tokenSymbol === 'NEAR';
    const transactionDate = new Date(tx.transaction.block_timestamp);

    if (isNativeTransfer || isUSDbased) {
      const result = processNativeReceipt(
        tx,
        recipientPublicKey,
        expectedAmount.toString(),
        isUSDbased,
      );
      if (result.isValid || !isUSDbased) {
        return { ...result, transactionDate };
      }
    }

    const result = processTokenReceipt(
      tx,
      tokenMint,
      recipientPublicKey,
      expectedAmount.toString(),
      isUSDbased,
    );
    return { ...result, transactionDate };
  } catch (error: any) {
    return { isValid: false, error: error.message };
  }
}

function processNativeReceipt(
  outcome: FinalExecutionOutcome,
  accountId: string,
  expectedAmount: string,
  isUSDbased: boolean,
) {
  if (!outcome.receipts) {
    return {
      isValid: false,
      error: 'No receipts found inside the transaction',
    };
  }

  const expectedAmountInYocto = nearApi.utils.format.parseNearAmount(
    expectedAmount.toString(),
  );
  if (!expectedAmountInYocto) {
    return {
      isValid: false,
      error: `Transfer amount doesn't match the expected amount`,
    };
  }
  for (const receipt of outcome.receipts) {
    if (receipt.receiver_id !== accountId) {
      continue;
    }

    for (const action of receipt.receipt.Action.actions) {
      if (action.Transfer) {
        // For USD-based payments, just check if any amount was transferred
        if (isUSDbased) {
          return { isValid: true };
        }
        // For non-USD payments, check exact amount
        if (action.Transfer.deposit === expectedAmountInYocto) {
          return { isValid: true };
        }
      }
    }
  }

  return {
    isValid: false,
    error: `No transfer found for ${accountId}`,
  };
}

function processTokenReceipt(
  receipt: FinalExecutionOutcome,
  tokenMint: Token,
  accountId: string,
  expectedAmount: string,
  isUSDbased: boolean,
) {
  const expectedAmountWithDecimals = formatTokenAmount(
    expectedAmount,
    tokenMint.decimals,
  );

  for (const outcome of receipt.receipts_outcome) {
    /// For USD payment, we check all receipts
    if (outcome.outcome.executor_id !== tokenMint.mintAddress && !isUSDbased) {
      continue;
    }

    for (const log of outcome.outcome.logs) {
      try {
        const logObject = JSON.parse(log.substring(log.search('{')));
        if (!logObject.event || logObject.event !== 'ft_transfer') {
          continue;
        }

        for (const action of logObject.data) {
          // For USD-based payments, just check if any amount was transferred to the correct recipient
          if (
            isUSDbased &&
            action.new_owner_id === accountId &&
            !!action.amount
          ) {
            return { isValid: true };
          }
          // For non-USD payments, check exact amount and recipient
          if (action.new_owner_id === accountId) {
            if (action.amount === expectedAmountWithDecimals) {
              return { isValid: true };
            } else {
              return {
                isValid: false,
                error: `Transfer amount doesn't match the expected amount`,
              };
            }
          }
        }
      } catch (error) {
        logger.warn(`Error parsing log: ${error}`);
        continue;
      }
    }
  }

  return {
    isValid: false,
    error: `No transfer found for ${accountId}`,
  };
}
