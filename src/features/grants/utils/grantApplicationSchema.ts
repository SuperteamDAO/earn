import { z } from 'zod';

import { URL_REGEX } from '@/constants/URL_REGEX';
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

import { type GrantQuestion } from '../types';
import {
  AGENTIC_ENGINEERING_FIXED_ASK,
  extractLumaEventSlug,
  LUMA_PREFIX,
} from './stGrant';

const X_USERNAME_REGEX = /^[A-Za-z0-9_]{1,15}$/;
const USDG_TOKEN = 'USDG';

const roundUsdGrantAmount = (value: unknown, token: string) => {
  if (token !== USDG_TOKEN) return value;
  if (value === '' || value === null || value === undefined) return value;

  const numericValue = typeof value === 'number' ? value : Number(value);

  if (!Number.isFinite(numericValue)) return value;

  return Math.round(numericValue);
};

export const normalizeGrantQuestionLinkAnswer = (answer: string) => {
  const trimmed = answer.trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

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
  questions?: GrantQuestion[],
  user?: User | null,
  isST = false,
  isAgenticEngineering = false,
) => {
  const fixedAsk = isAgenticEngineering
    ? minReward === maxReward && minReward > 0
      ? minReward
      : AGENTIC_ENGINEERING_FIXED_ASK
    : undefined;

  return z
    .object({
      projectTitle: z
        .string()
        .min(1, 'Project title is required')
        .max(100, 'Project title must be less than 100 characters'),
      projectOneLiner: z
        .string()
        .min(1, 'One-liner description is required')
        .max(150, 'Description must be less than 150 characters'),
      ask: z.preprocess(
        (value) => {
          if (value === '' || value === null || value === undefined) {
            return fixedAsk ?? value;
          }
          return roundUsdGrantAmount(value, token);
        },
        z
          .number({
            required_error: 'Grant amount is required',
            invalid_type_error: 'Please enter a valid number',
          })
          .min(
            Math.max(1, minReward),
            `Amount must be at least ${Math.max(1, minReward || 1)} ${token}`,
          )
          .max(maxReward, `Amount cannot exceed ${maxReward || 1} ${token}`),
      ),
      projectDetails: z.string().min(1, 'Project details are required'),
      walletAddress: z.string().min(1, 'Solana Wallet Address is required'),
      projectTimeline: isST
        ? z.string().optional()
        : z.string().min(1, 'Project timeline is required'),
      proofOfWork: isST
        ? z.string().optional()
        : z.string().min(1, 'Proof of work is required'),
      milestones: isAgenticEngineering
        ? z.string().optional()
        : z.string().min(1, 'Milestones are required'),
      kpi:
        isST || isAgenticEngineering
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
      lumaLink: isST ? lumaLinkSchema : z.string().optional(),
      expenseBreakdown: isST
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
        questions?.forEach((question, index) => {
          const answer = data.answers?.[index]?.answer?.trim();
          const isOptional = Boolean(question.optional);

          if (!isOptional && !answer) {
            ctx.addIssue({
              code: 'custom',
              path: ['answers', index, 'answer'],
              message: 'This field is required',
            });
            return;
          }

          if (answer && question.type === 'link') {
            const linkAnswer = normalizeGrantQuestionLinkAnswer(answer);
            const urlResult = z.string().regex(URL_REGEX).safeParse(linkAnswer);
            if (!urlResult.success) {
              ctx.addIssue({
                code: 'custom',
                path: ['answers', index, 'answer'],
                message: 'Please enter a valid URL',
              });
            }
          }
        });
      }

      if (
        isAgenticEngineering &&
        typeof fixedAsk === 'number' &&
        data.ask !== fixedAsk
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['ask'],
          message: `Grant amount is fixed at ${fixedAsk} ${token}`,
        });
      }
    });
};
