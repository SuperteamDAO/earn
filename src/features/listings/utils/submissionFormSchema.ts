import { z } from 'zod';

import { URL_REGEX } from '@/constants/URL_REGEX';
import { type User } from '@/interface/user';

import { tweetLinkRegex } from '@/features/social/utils/regex';
import { telegramUsernameSchema } from '@/features/social/utils/schema';
import {
  extractXHandle,
  isHandleVerified,
  isXUrl,
} from '@/features/social/utils/x-verification';

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
          z.string().regex(tweetLinkRegex, 'Invalid tweet link'),
        ])
        .optional(),
      otherInfo: z.string().optional(),
      ask: z.union([z.int().min(0), z.null()]).optional(),
      eligibilityAnswers: z
        .array(
          z.object({
            question: z.string(),
            answer: z.string(),
            optional: z.boolean().optional().nullable(),
          }),
        )
        .optional(),
      telegram:
        !user?.telegram && listing?.type === 'project'
          ? telegramUsernameSchema
          : z.string().nullable().optional(),
    })
    .superRefine((data, ctx) => {
      const requiresTelegram = listing.type === 'project' && !user?.telegram;
      if (requiresTelegram && !data.telegram) {
        ctx.addIssue({
          code: 'custom',
          path: ['telegram'],
          message: 'Telegram is required',
        });
      }

      if (listing.type !== 'project' && !data.link) {
        ctx.addIssue({
          code: 'custom',
          path: ['link'],
          message: 'Add a valid link to continue',
        });
      }

      if (data.tweet && isXUrl(data.tweet)) {
        const handle = extractXHandle(data.tweet);
        if (handle) {
          const verifiedHandles = user?.linkedTwitter || [];
          if (!isHandleVerified(handle, verifiedHandles)) {
            ctx.addIssue({
              code: 'custom',
              path: ['tweet'],
              message: 'We need to verify that you own this X account.',
            });
          }
        }
      }

      if (data.link && isXUrl(data.link)) {
        const handle = extractXHandle(data.link);
        if (handle) {
          const verifiedHandles = user?.linkedTwitter || [];
          if (!isHandleVerified(handle, verifiedHandles)) {
            ctx.addIssue({
              code: 'custom',
              path: ['link'],
              message: 'We need to verify that you own this X account.',
            });
          }
        }
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
            const optional = data.eligibilityAnswers?.[index]?.optional;
            if (!optional && (!answer || answer.trim() === '')) {
              ctx.addIssue({
                code: 'custom',
                path: ['eligibilityAnswers', index, 'answer'],
                message: `Required`,
              });
            }
            if (answer && (question.isLink || question.type === 'link')) {
              const urlResult = z
                .string()
                .regex(URL_REGEX, 'Invalid URL')
                .safeParse(answer);
              if (!urlResult.success) {
                ctx.addIssue({
                  code: "custom",
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
