import * as z from 'zod';

export const withdrawFormSchema = z.object({
  tokenAddress: z.string().min(1, 'Please select a token'),
  amount: z
    .string()
    .refine((val) => !isNaN(Number(val)), 'Amount must be a number')
    .refine((val) => Number(val) > 0, 'Amount must be greater than 0'),
  address: z.string().min(32, 'Invalid Solana address'),
});

export type WithdrawFormData = z.infer<typeof withdrawFormSchema>;
