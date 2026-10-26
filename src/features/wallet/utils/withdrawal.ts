import { isAddress } from '@solana/kit';

// Earn's withdraw form, checked the same way in the browser and by
// /api/wallet/create-signed-transaction.
export interface WithdrawFormData {
  tokenAddress: string;
  amount: string;
  recipientAddress: string;
}

export const SOL_MINT = 'So11111111111111111111111111111111111111112';

const solErrorMessage = 'The Solana wallet address you entered is invalid';

// What's wrong with each field, in Earn's words; empty when nothing is.
export function withdrawalErrors(
  values: WithdrawFormData,
): Partial<Record<keyof WithdrawFormData, string>> {
  const errors: Partial<Record<keyof WithdrawFormData, string>> = {};
  if (values.tokenAddress.length < 1) {
    errors.tokenAddress = 'Please select a token';
  }
  if (isNaN(Number(values.amount))) {
    errors.amount = 'Amount must be a number';
  } else if (!(Number(values.amount) > 0)) {
    errors.amount = 'Amount must be greater than 0';
  }
  if (
    values.recipientAddress.length < 32 ||
    !isAddress(values.recipientAddress)
  ) {
    errors.recipientAddress = solErrorMessage;
  }
  return errors;
}

// The first problem, as the server reports it.
export const withdrawalProblem = (values: WithdrawFormData): string | null =>
  Object.values(withdrawalErrors(values))[0] ?? null;
