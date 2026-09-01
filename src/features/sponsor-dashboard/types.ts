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

type UserWithChapter = PrismaUserWithoutKYC & {
  peopleId?: string | null;
  people?: {
    id: string;
    chapterId?: string | null;
    type?: string | null;
    chapter?: {
      id: string;
      name: string;
      icons?: string | null;
    } | null;
  } | null;
};

export interface GrantApplicationWithUser extends GrantApplicationModel {
  user: UserWithChapter;
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

const paymentTxIdSchema = z.string().trim().min(1).max(500);

export const verifyExternalPaymentRequestSchema = z.object({
  listingId: z.string().trim().min(1).max(191),
  paymentLinks: z
    .array(
      z
        .object({
          submissionId: z.string().trim().min(1).max(191),
          link: z.string().max(2048).optional(),
          isVerified: z.boolean(),
          txId: z.string().trim().max(500),
        })
        .refine((payment) => payment.isVerified || payment.txId.length > 0, {
          message: 'Transaction ID is required',
          path: ['txId'],
        }),
    )
    .min(1)
    .refine(
      (payments) => payments.filter((payment) => payment.txId).length <= 25,
      { message: 'Cannot verify more than 25 transaction IDs at once' },
    ),
});

export const addSubmissionPaymentRequestSchema = z.object({
  id: z.string().trim().min(1).max(191),
  paymentDetails: z
    .array(
      z.object({
        txId: paymentTxIdSchema,
        amount: z.number().finite().positive(),
        tranche: z.number().int().positive(),
      }),
    )
    .min(1)
    .max(25),
});

export type ValidatePaymentResult = {
  submissionId: string;
  txId: string;
  status: 'SUCCESS' | 'FAIL' | 'ALREADY_VERIFIED';
  message?: string;
  actualAmount?: number;
};
