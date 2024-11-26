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
  paymentLinks: z
    .array(
      z
        .object({
          submissionId: z.string(),
          link: z.string().optional(),
          isVerified: z.boolean(),
        })
        .refine(
          (data) => {
            if (data.isVerified) return true;
            return (
              !data.link ||
              ALLOWED_URL_PREFIXES.some((prefix) =>
                data.link?.startsWith(prefix),
              )
            );
          },
          {
            message: `请添加有效的交易链接 (${ALLOWED_URL_PREFIXES.join(' 或 ')})`,
          },
        )
        .transform((data) => ({
          ...data,
          txId: data.isVerified ? '' : data.link?.split('/tx/')[1] || '',
        })),
    )
    .refine((links) => links.some((link) => link.link || link.isVerified), {
      message: '至少有一个支付交易链接或已验证的支付',
    }),
});

export type VerifyPaymentsFormData = z.infer<typeof verifyPaymentsSchema>;

export type ValidatePaymentResult = {
  submissionId: string;
  txId: string;
  status: 'SUCCESS' | 'FAIL' | 'ALREADY_VERIFIED';
  message?: string;
};
