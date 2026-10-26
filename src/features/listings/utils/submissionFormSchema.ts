import { z } from 'zod';

import { URL_REGEX } from '@/constants/URL_REGEX';
import { type User } from '@/interface/user';

import { tweetLinkRegex } from '@/features/social/utils/regex';
import {
  extractXHandle,
  INVALID_X_STATUS_LINK_MESSAGE,
  isHandleVerified,
  isXInternalStatusUrl,
  isXUrl,
} from '@/features/social/utils/x-verification';

import { type Listing } from '../types';

const submissionSchema = (listing: Listing, user: User | null) =>
  z
    .object({
      link: z
        .union([z.literal(''), z.string().regex(URL_REGEX, 'Invalid URL')])
        .optional(),
      tweet: z
        .union([
          z.literal(''),
          z
            .string()
            .refine(
              (value) =>
                tweetLinkRegex.test(value) || isXInternalStatusUrl(value),
              'Invalid tweet link',
            ),
        ])
        .optional(),
      otherInfo: z.string().optional(),
      eligibilityAnswers: z
        .array(
          z.object({
            question: z.string(),
            answer: z.string(),
          }),
        )
        .optional(),
    })
    .superRefine((data, ctx) => {
      if (!data.link) {
        ctx.addIssue({
          code: 'custom',
          path: ['link'],
          message: 'Add a valid link to continue',
        });
      }

      if (listing.type === 'bounty' && data.tweet) {
        if (isXInternalStatusUrl(data.tweet)) {
          ctx.addIssue({
            code: 'custom',
            path: ['tweet'],
            message: INVALID_X_STATUS_LINK_MESSAGE,
          });
        }
      }

      if (listing.type === 'bounty' && data.link) {
        if (isXInternalStatusUrl(data.link)) {
          ctx.addIssue({
            code: 'custom',
            path: ['link'],
            message: INVALID_X_STATUS_LINK_MESSAGE,
          });
        }
      }

      if (
        data.tweet &&
        isXUrl(data.tweet) &&
        !isXInternalStatusUrl(data.tweet)
      ) {
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

      if (data.link && isXUrl(data.link) && !isXInternalStatusUrl(data.link)) {
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
            const byQuestion = data.eligibilityAnswers?.find(
              (entry) => entry.question === question.question,
            );
            const byIndex = data.eligibilityAnswers?.[index];
            const answer = (byQuestion?.answer ?? byIndex?.answer)?.trim();
            const optional = Boolean(question.optional);
            if (!optional && !answer) {
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
