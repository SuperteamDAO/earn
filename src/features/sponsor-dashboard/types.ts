import { z } from 'zod';

import { type PrismaUserWithoutKYC } from '@/interface/user';
import { type GrantApplicationModel } from '@/prisma/models/GrantApplication';
import { type GrantTrancheModel } from '@/prisma/models/GrantTranche';

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

export interface GrantApplicationWithUser extends GrantApplicationModel {
  user: PrismaUserWithoutKYC;
  totalEarnings?: number;
  GrantTranche?: GrantTrancheModel[];
}

export interface SponsorStats {
  name?: string;
  slug?: string;
  logo?: string;
  yearOnPlatform?: number;
  totalRewardAmount?: number;
  totalListingsAndGrants?: number;
  totalSubmissionsAndApplications?: number;
  totalHackathonTracks?: number;
  totalHackathonSubmissions?: number;
  totalHackathonRewards?: number;
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
            message: 'Please add a Solscan/Solana.fm link',
            path: ['link'],
          },
        )
        .transform((data) => ({
          ...data,
          txId: data.isVerified
            ? ''
            : data.link
                ?.split('/tx/')[1]
                ?.split('?')[0]
                ?.split('#')[0]
                ?.trim() || '',
        })),
    )
    .refine((links) => links.some((link) => link.link || link.isVerified), {
      message: 'Please add atleast one valid payment link',
    }),
});

export type VerifyPaymentsFormData = z.infer<typeof verifyPaymentsSchema>;

export type ValidatePaymentResult = {
  submissionId: string;
  txId: string;
  status: 'SUCCESS' | 'FAIL' | 'ALREADY_VERIFIED';
  message?: string;
  actualAmount?: number;
};
