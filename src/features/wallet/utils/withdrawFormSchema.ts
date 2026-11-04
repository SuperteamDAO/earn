import * as z from 'zod';

import { validateSolAddress } from '@/utils/validateSolAddress';

const solErrorMessage = 'The Solana wallet address you entered is invalid';

// digits with at most one '.', e.g. '12', '12.' or '.5': no signs, exponents or separators
export const DECIMAL_AMOUNT_REGEX = /^\d*(?:\.\d*)?$/;

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
