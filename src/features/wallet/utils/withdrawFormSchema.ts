import * as z from 'zod';

import { validateSolAddress } from '@/utils/validateSolAddress';

const solErrorMessage = 'The Solana wallet address you entered is invalid';

export const withdrawFormSchema = z.object({
  tokenAddress: z.string().min(1, 'Please select a token'),
  amount: z
    .string()
    .refine((val) => !isNaN(Number(val)), 'Amount must be a number')
    .refine((val) => Number(val) > 0, 'Amount must be greater than 0'),
  address: z
    .string()
    .min(32, solErrorMessage)
    .refine((val) => validateSolAddress(val), solErrorMessage),
});

export type WithdrawFormData = z.infer<typeof withdrawFormSchema>;
