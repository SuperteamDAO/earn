import * as z from 'zod';

import { validateSolAddress } from '@/utils/validateSolAddress';

const solErrorMessage = 'The Solana wallet address you entered is invalid';

// digits with at most one '.', e.g. '12', '12.' or '.5': no signs, exponents or separators
export const DECIMAL_AMOUNT_REGEX = /^\d*(?:\.\d*)?$/;

// en-US thousands grouping, e.g. '1,234' or '1,234.56' — not comma-decimals like '1,5'
const US_GROUPED_AMOUNT_REGEX = /^\d{1,3}(,\d{3})+(\.\d*)?$/;

/** Accept a plain decimal, or strip en-US grouping commas. Reject ambiguous commas. */
export function normalizeAmountInput(raw: string): string | null {
  const trimmed = raw.trim();
  if (DECIMAL_AMOUNT_REGEX.test(trimmed)) return trimmed;
  if (US_GROUPED_AMOUNT_REGEX.test(trimmed)) return trimmed.replace(/,/g, '');
  return null;
}

export const withdrawFormSchema = z.object({
  tokenAddress: z.string().min(1, 'Please select a token'),
  amount: z
    .string()
    .regex(DECIMAL_AMOUNT_REGEX, 'Amount must be a number')
    .refine((val) => Number(val) > 0, 'Amount must be greater than 0'),
  recipientAddress: z
    .string()
    .min(32, solErrorMessage)
    .refine((val) => validateSolAddress(val), solErrorMessage),
});

export type WithdrawFormData = z.infer<typeof withdrawFormSchema>;
