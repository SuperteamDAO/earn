import { z } from 'zod';

import { CHAIN_NAME } from '@/constants/project';
import { tokenList } from '@/constants/tokenList';
import { URL_REGEX } from '@/constants/URL_REGEX';
import { type User } from '@/interface/user';
import { validateNearAddress } from '@/utils/validateNearAddress';

import { walletFieldListings } from '../constants';
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
      otherTokenDetails: z.string().optional(),
      ask: z.union([z.number().int().min(1), z.null()]).optional(),
      eligibilityAnswers: z
        .array(z.object({ question: z.string(), answer: z.string() }))
        .optional(),
      publicKey: z.string().optional(),
      token: z
        .string()
        .refine((token) => tokenList.find((t) => t.tokenSymbol === token), {
          message: 'Invalid token provided',
        })
        .optional()
        .nullable(),
    })
    .superRefine((data, ctx) => {
      if (
        !walletFieldListings.includes(listing.id!) &&
        user &&
        !user?.publicKey &&
        !data.publicKey
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['publicKey'],
          message: `${CHAIN_NAME} Wallet Address is required`,
        });
      }
      if (data.publicKey) {
        const validate = validateNearAddress(data.publicKey);
        if (!validate.isValid) {
          ctx.addIssue({
            code: 'custom',
            path: ['publicKey'],
            message: `Invalid ${CHAIN_NAME} Wallet Address`,
          });
        }
      }
      if (
        listing.type !== 'project' &&
        listing.type !== 'sponsorship' &&
        !data.link &&
        !walletFieldListings.includes(listing.id!)
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['link'],
          message: 'Add a valid link to continue',
        });
      }
      if (
        (listing.type === 'project' || listing.type === 'sponsorship') &&
        listing.compensationType !== 'fixed'
      ) {
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

      if (listing.token === 'Any') {
        if (!data.token) {
          ctx.addIssue({
            code: 'custom',
            path: ['token'],
            message: 'Token is required for listing with "Any" token',
          });
        }
        if (data.token === 'Other' && !data.otherTokenDetails) {
          ctx.addIssue({
            code: 'custom',
            path: ['otherTokenDetails'],
            message: 'Token details are required',
          });
        }
      }

      if (listing.token !== 'Any' && data.token === 'Other') {
        ctx.addIssue({
          code: 'custom',
          path: ['token'],
          message:
            'Other token is only available for listings with "Any" token',
        });
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
            if (question.type === 'checkbox' && question.optional !== true) {
              if (answer !== 'true') {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: 'You must accept this requirement',
                  path: ['eligibilityAnswers', index, 'answer'],
                });
              }
            }
            if (
              (!answer || answer.trim() === '') &&
              question.optional !== true
            ) {
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
