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
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export async function validatePayment({
  txId,
  recipientPublicKey,
  expectedAmount,
  tokenMint,
}: ValidatePaymentParams): Promise<ValidationResult> {
  try {
    logger.debug(`Getting Transaction Information from RPC for txId: ${txId}`);
    const tx: FinalExecutionOutcome = await getTransactionStatus(
      recipientPublicKey,
      txId,
    );

    if (!tx) {
      return { isValid: false, error: 'Invalid transaction' };
    }

    if (tx.final_execution_status !== 'FINAL') {
      return { isValid: false, error: 'Transaction not finalized' };
    }

    if (!tx.receipts) {
      return { isValid: false, error: 'No receipts found' };
    }

    const isNativeTransfer = tokenMint.tokenSymbol === 'NEAR';

    for (const receipt of tx.receipts) {
      if (isNativeTransfer && receipt.receiver_id !== recipientPublicKey) {
        continue;
      }

      if (!isNativeTransfer && receipt.receiver_id !== tokenMint.mintAddress) {
        continue;
      }
    }

    if (tx.transaction_outcome.outcome.status instanceof Object) {
      if (tx.transaction_outcome.outcome.status.Failure !== undefined) {
        return { isValid: false, error: 'Transaction failed' };
      }
    }

    if (tokenMint.tokenSymbol === 'NEAR') {
      return processNativeReceipt(
        tx,
        recipientPublicKey,
        expectedAmount.toString(),
      );
    }

    return processTokenReceipt(
      tx,
      tokenMint,
      recipientPublicKey,
      expectedAmount.toString(),
    );
  } catch (error: any) {
    return { isValid: false, error: error.message };
  }
}

function processNativeReceipt(
  outcome: FinalExecutionOutcome,
  accountId: string,
  expectedAmount: string,
) {
  if (!outcome.receipts) {
    return { isValid: false, error: 'No receipts found' };
  }

  const expectedAmountInYocto = nearApi.utils.format.parseNearAmount(
    expectedAmount.toString(),
  );
  if (!expectedAmountInYocto) {
    return { isValid: false, error: 'Invalid expected amount' };
  }
  for (const receipt of outcome.receipts) {
    if (receipt.receiver_id !== accountId) {
      continue;
    }

    for (const action of receipt.receipt.Action.actions) {
      if (
        action.Transfer &&
        action.Transfer.deposit === expectedAmountInYocto
      ) {
        return { isValid: true };
      }
    }
  }

  return { isValid: false, error: 'No transfer found' };
}

function processTokenReceipt(
  receipt: FinalExecutionOutcome,
  tokenMint: Token,
  accountId: string,
  expectedAmount: string,
) {
  const expectedAmountWithDecimals = formatTokenAmount(
    expectedAmount,
    tokenMint.decimals,
  );

  for (const outcome of receipt.receipts_outcome) {
    if (outcome.outcome.executor_id !== tokenMint.mintAddress) {
      continue;
    }

    for (const log of outcome.outcome.logs) {
      try {
        const logObject = JSON.parse(log.substring(log.search('{')));
        if (!logObject.event || logObject.event !== 'ft_transfer') {
          continue;
        }

        for (const action of logObject.data) {
          if (
            action.new_owner_id === accountId &&
            action.amount === expectedAmountWithDecimals
          ) {
            return { isValid: true };
          }
        }
      } catch (error) {
        logger.warn(`Error parsing log: ${error}`);
        continue;
      }
    }
  }

  return { isValid: false, error: 'No transfer found' };
}
