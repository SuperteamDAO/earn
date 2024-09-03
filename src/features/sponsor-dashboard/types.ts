import { type GrantApplication, type User } from '@prisma/client';
import { z } from 'zod';

export type ScoutRowType = {
  id: string;
  name: string;
  pfp: string | null;
  username: string | null;
  dollarsEarned: number;
  score: number;
  skills: string[];
  recommended: boolean;
  invited: boolean;
  userId: string;
};

export interface GrantApplicationWithUser extends GrantApplication {
  user: User;
}

export interface SponsorStats {
  name?: string;
  logo?: string;
  yearOnPlatform?: number;
  totalRewardAmount?: number;
  totalListingsAndGrants?: number;
  totalSubmissionsAndApplications?: number;
}

const ALLOWED_URL_PREFIXES = [
  'https://solscan.io/tx/',
  'https://solana.fm/tx/',
  'https://explorer.solana.com/tx/',
];

export const verifyPaymentsSchema = z.object({
  paymentLinks: z.array(
    z
      .object({
        submissionId: z.string(),
        link: z
          .string()
          .min(1, { message: 'Payment link is required' })
          .refine(
            (url) =>
              ALLOWED_URL_PREFIXES.some((prefix) => url.startsWith(prefix)),
            {
              message: `Please add a valid transaction link (${ALLOWED_URL_PREFIXES.join(' or ')})`,
            },
          ),
      })
      .transform((data) => ({
        ...data,
        txId: data.link.split('/tx/')[1],
      })),
  ),
});

export type VerifyPaymentsFormData = z.infer<typeof verifyPaymentsSchema>;

export type ValidatePaymentResult = {
  submissionId: string;
  txId: string;
  status: 'SUCCESS' | 'FAIL';
  message?: string;
};
