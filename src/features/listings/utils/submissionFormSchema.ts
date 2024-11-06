import { z } from 'zod';

import { type Listing } from '../types';

const submissionSchema = (
  listing: Listing,
  minRewardAsk: number,
  maxRewardAsk: number,
) =>
  z
    .object({
      applicationLink: z.string().url('Invalid URL').optional(),
      tweetLink: z.string().url('Invalid Tweet Link').optional(),
      otherInfo: z.string().optional(),
      ask: z.preprocess(
        (val) => (val === '' ? undefined : Number(val)),
        z
          .number()
          .optional()
          .refine(
            (value) =>
              value === undefined ||
              (minRewardAsk !== undefined &&
                maxRewardAsk !== undefined &&
                value >= minRewardAsk &&
                value <= maxRewardAsk),
            {
              message: `Compensation must be between ${minRewardAsk} and ${maxRewardAsk}`,
            },
          ),
      ),
      publicKey: z.string().optional(),
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
      if (listing.type === 'project' && !data.applicationLink) {
        ctx.addIssue({
          code: 'custom',
          path: ['applicationLink'],
          message: 'Application link is required for non-project listings',
        });
      }
      if (listing.type === 'project' && data.tweetLink) {
        ctx.addIssue({
          code: 'custom',
          path: ['tweetLink'],
          message: 'Tweet link can only be provided for non-project listings',
        });
      }
      if (
        listing.type === 'project' &&
        listing.compensationType !== 'fixed' &&
        data.ask === undefined
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['ask'],
          message:
            'Compensation is required for project listings with non-fixed compensation',
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
            if (!answer || answer.trim() === '') {
              ctx.addIssue({
                code: 'custom',
                path: ['eligibilityAnswers', index, 'answer'],
                message: `Answer for "${question.question}" is required`,
              });
            }
          });
        }
      }
    });

export { submissionSchema };
