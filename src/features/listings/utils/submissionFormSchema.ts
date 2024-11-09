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
      tweet: z.union([z.literal(''), z.string().trim().url()]),
      otherInfo: z.string().optional(),
      ask: z.union([z.number().int().min(0), z.null()]).optional(),
      publicKey: z.string().optional(),
      eligibilityAnswers: z
        .array(z.object({ question: z.string(), answer: z.string() }))
        .optional(),
    })
    .superRefine((data, ctx) => {
      if (listing.type !== 'project' && !data.applicationLink) {
        ctx.addIssue({
          code: 'custom',
          path: ['applicationLink'],
          message: 'Application link is required for non-project listings',
        });
      }
      if (listing.type === 'project' && listing.compensationType !== 'fixed') {
        if (data.ask === undefined || data.ask === null) {
          ctx.addIssue({
            code: 'custom',
            path: ['ask'],
            message:
              'Compensation is required for project listings with non-fixed compensation',
          });
        } else if (!data.ask) {
          if (data.ask < minRewardAsk) {
            ctx.addIssue({
              code: 'custom',
              path: ['ask'],
              message: `Compensation must be at least ${minRewardAsk}`,
            });
          }
          if (data.ask > maxRewardAsk) {
            ctx.addIssue({
              code: 'custom',
              path: ['ask'],
              message: `Compensation cannot exceed ${maxRewardAsk}`,
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
