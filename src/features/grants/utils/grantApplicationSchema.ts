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

import { extractLumaEventSlug, LUMA_PREFIX } from './touchingGrass';

const X_USERNAME_REGEX = /^[A-Za-z0-9_]{1,15}$/;

const twitterProfileSchema = z
  .string()
  .transform((val) => (typeof val === 'string' ? val.trim() : val))
  .refine((val) => Boolean(val && val.length > 0), {
    message: 'Please add a valid X profile link',
  })
  .refine((val) => X_USERNAME_REGEX.test(val) || twitterRegex.test(val), {
    message: 'Please add a valid X profile link',
  })
  .transform((val) => {
    if (X_USERNAME_REGEX.test(val)) {
      return `https://x.com/${val}`;
    }
    const handle = extractXHandle(val);
    return handle ? `https://x.com/${handle}` : val;
  });

const lumaLinkSchema = z
  .string()
  .trim()
  .min(1, 'Luma event link is required')
  .refine(
    (val) => {
      const slug = extractLumaEventSlug(val);
      return slug !== null && slug.length > 0;
    },
    {
      message: 'Please enter a valid Luma event link (e.g., lu.ma/your-event)',
    },
  )
  .transform((val) => {
    const slug = extractLumaEventSlug(val);
    return slug ? `${LUMA_PREFIX}${slug}` : val;
  });

export const grantApplicationSchema = (
  minReward: number,
  maxReward: number,
  token: string,
  questions?: { order: number; question: string }[],
  user?: User | null,
  isTouchingGrass?: boolean,
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
          required_error: 'Grant amount is required',
          invalid_type_error: 'Please enter a valid number',
        })
        .min(
          Math.max(1, minReward),
          `Amount must be at least ${Math.max(1, minReward || 1)} ${token}`,
        )
        .max(maxReward, `Amount cannot exceed ${maxReward || 1} ${token}`),
      projectDetails: z.string().min(1, 'Project details are required'),
      walletAddress: z.string().min(1, 'Solana Wallet Address is required'),
      projectTimeline: isTouchingGrass
        ? z.string().optional()
        : z.string().min(1, 'Project timeline is required'),
      proofOfWork: isTouchingGrass
        ? z.string().optional()
        : z.string().min(1, 'Proof of work is required'),
      milestones: z.string().min(1, 'Milestones are required'),
      kpi: isTouchingGrass
        ? z.string().optional()
        : z.string().min(1, 'KPI is required'),
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
      lumaLink: isTouchingGrass ? lumaLinkSchema : z.string().optional(),
      expenseBreakdown: isTouchingGrass
        ? z.string().min(1, 'Expense breakdown is required')
        : z.string().optional(),
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
