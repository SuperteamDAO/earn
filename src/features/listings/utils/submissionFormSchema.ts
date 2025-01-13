import { z } from 'zod';

import { URL_REGEX } from '@/constants/URL_REGEX';
import { type User } from '@/interface/user';
import { validateSolanaAddress } from '@/utils/validateSolAddress';

import { type Listing } from '../types';

const submissionSchema = (
  listing: Listing,
  minRewardAsk: number,
  maxRewardAsk: number,
  user: User | null,
) =>
  z
    .object({
      link: z
        .union([z.literal(''), z.string().regex(URL_REGEX, 'Invalid URL')])
        .optional(),
      tweet: z
        .union([
          z.literal(''),
          z.string().trim().regex(URL_REGEX, 'Invalid URL'),
        ])
        .optional(),
      otherInfo: z.string().optional(),
      ask: z.union([z.number().int().min(0), z.null()]).optional(),
      eligibilityAnswers: z
        .array(z.object({ question: z.string(), answer: z.string() }))
        .optional(),
      publicKey: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (user && !user?.publicKey && !data.publicKey) {
        ctx.addIssue({
          code: 'custom',
          path: ['publicKey'],
          message: 'Solana Wallet Address is required',
        });
      }
      if (data.publicKey) {
        const validate = validateSolanaAddress(data.publicKey);
        if (!validate.isValid) {
          ctx.addIssue({
            code: 'custom',
            path: ['publicKey'],
            message: 'Invalid Solana Wallet Address',
          });
        }
      }
      if (listing.type !== 'project' && !data.link) {
        ctx.addIssue({
          code: 'custom',
          path: ['link'],
          message: 'Add a valid link to continue',
        });
      }
      if (listing.type === 'project' && listing.compensationType !== 'fixed') {
        if (data.ask === undefined || data.ask === null || !data.ask) {
          ctx.addIssue({
            code: 'custom',
            path: ['ask'],
            message: 'Compensation is required',
          });
        } else if (
          listing.compensationType === 'range' &&
          data.ask < minRewardAsk
        ) {
          ctx.addIssue({
            code: 'custom',
            path: ['ask'],
            message: `Compensation must be at least ${minRewardAsk}`,
          });
        } else if (
          listing.compensationType === 'range' &&
          data.ask > maxRewardAsk
        ) {
          ctx.addIssue({
            code: 'custom',
            path: ['ask'],
            message: `Compensation cannot exceed ${maxRewardAsk}`,
          });
        }
      }

      const hasEligibilityQuestions =
        Array.isArray(listing.eligibility) && listing.eligibility.length > 0;

      if (hasEligibilityQuestions) {
        if (!data.eligibilityAnswers || data.eligibilityAnswers.length === 0) {
          ctx.addIssue({
            code: 'custom',
            path: ['eligibilityAnswers'],
            message: 'Eligibility answers are required for this listing',
          });
        } else {
          listing?.eligibility?.forEach((question, index) => {
            const answer = data.eligibilityAnswers?.[index]?.answer;
            if (!answer || answer.trim() === '') {
              ctx.addIssue({
                code: 'custom',
                path: ['eligibilityAnswers', index, 'answer'],
                message: `Answer for "${question.question}" is required`,
              });
            }
            if (answer && (question.isLink || question.type === 'link')) {
              const urlResult = z.string().url().safeParse(answer);
              if (!urlResult.success) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: 'Please enter a valid URL',
                  path: ['eligibilityAnswers', index, 'answer'],
                });
              }
            }
          });
        }
      }
    });

export { submissionSchema };
