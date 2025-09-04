import { z } from 'zod';

import { type User } from '@/interface/user';
import { validateSolAddress } from '@/utils/validateSolAddress';

import { twitterRegex } from '@/features/social/utils/regex';
import {
  githubUsernameSchema,
  telegramUsernameSchema,
} from '@/features/social/utils/schema';
import {
  extractXHandle,
  isHandleVerified,
} from '@/features/social/utils/x-verification';

const X_USERNAME_REGEX = /^[A-Za-z0-9_]{1,15}$/;

const twitterProfileSchema = z
  .string()
  .transform((val) => (typeof val === 'string' ? val.trim() : val))
  .refine((val) => Boolean(val && val.length > 0), {
      error: 'Please add a valid X profile link'
})
  .refine((val) => X_USERNAME_REGEX.test(val) || twitterRegex.test(val), {
      error: 'Please add a valid X profile link'
})
  .transform((val) => {
    if (X_USERNAME_REGEX.test(val)) {
      return `https://x.com/${val}`;
    }
    const handle = extractXHandle(val);
    return handle ? `https://x.com/${handle}` : val;
  });

export const grantApplicationSchema = (
  minReward: number,
  maxReward: number,
  token: string,
  questions?: { order: number; question: string }[],
  user?: User | null,
) =>
  z
    .object({
      projectTitle: z
        .string()
        .min(1, 'Project title is required')
        .max(100, 'Project title must be less than 100 characters'),
      projectOneLiner: z
        .string()
        .min(1, 'One-liner description is required')
        .max(150, 'Description must be less than 150 characters'),
      ask: z
        .number({
            error: (issue) => issue.input === undefined ? 'Grant amount is required' : 'Please enter a valid number'
        })
        .min(minReward, `Amount must be at least ${minReward} ${token}`)
        .max(maxReward, `Amount cannot exceed ${maxReward} ${token}`),
      projectDetails: z.string().min(1, 'Project details are required'),
      walletAddress: z.string().min(1, 'Solana Wallet Address is required'),
      projectTimeline: z.string().min(1, 'Project timeline is required'),
      proofOfWork: z.string().min(1, 'Proof of work is required'),
      milestones: z.string().min(1, 'Milestones are required'),
      kpi: z.string().min(1, 'KPI is required'),
      twitter: twitterProfileSchema,
      github: z
        .preprocess(
          (val) => (val === '' ? undefined : val),
          githubUsernameSchema.optional().nullable(),
        )
        .optional()
        .nullable(),
      answers: z
        .array(z.object({ question: z.string(), answer: z.string() }))
        .optional(),
      telegram: telegramUsernameSchema,
    })
    .superRefine((data, ctx) => {
      if (data.walletAddress) {
        const validate = validateSolAddress(data.walletAddress);
        if (!validate) {
          ctx.addIssue({
            code: 'custom',
            path: ['walletAddress'],
            message: 'Invalid Solana Wallet Address',
          });
        }
      }

      if (data.twitter) {
        const value = data.twitter;
        const isValidProfile =
          X_USERNAME_REGEX.test(value) || twitterRegex.test(value);

        if (!isValidProfile) {
          return;
        }

        const handle = extractXHandle(value);
        if (handle) {
          const verifiedHandles = user?.linkedTwitter || [];
          const isVerified = isHandleVerified(handle, verifiedHandles);

          if (!isVerified) {
            ctx.addIssue({
              code: 'custom',
              path: ['twitter'],
              message: 'We need to verify that you own this X account.',
            });
          }
        }
      }

      const hasQuestions = Array.isArray(questions) && questions.length > 0;

      if (hasQuestions) {
        if (!data.answers || data.answers.length === 0) {
          ctx.addIssue({
            code: 'custom',
            path: ['answers'],
            message: 'Answers are required for this listing',
          });
        } else {
          questions?.forEach((question, index) => {
            const answer = data.answers?.[index]?.answer;
            if (!answer || answer?.trim() === '') {
              ctx.addIssue({
                code: 'custom',
                path: ['answers', index, 'answer'],
                message: `Answer for "${question.question}" is required`,
              });
            }
          });
        }
      }
    });
