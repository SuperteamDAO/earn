import { z } from 'zod';

import { type Listing } from '../types';

const submissionSchema = (
  listing: Listing,
  minRewardAsk: number,
  maxRewardAsk: number,
) =>
  z
    .object({
      link: z
        .union([
          z.literal(''),
          z
            .string()
            .url('Invalid URL')
            .max(500, 'URL cannot exceed 500 characters'),
        ])
        .optional(),
      tweet: z
        .union([
          z.literal(''),
          z
            .string()
            .trim()
            .url()
            .max(500, 'Tweet cannot exceed 500 characters'),
        ])
        .optional(),
      otherInfo: z.string().optional(),
      ask: z.union([z.number().int().min(0), z.null()]).optional(),
      eligibilityAnswers: z
        .array(z.object({ question: z.string(), answer: z.string() }))
        .optional(),
    })
    .superRefine((data, ctx) => {
      if (listing.type !== 'project' && !data.link) {
        ctx.addIssue({
          code: 'custom',
          path: ['link'],
          message: 'Application link is required for non-project listings',
        });
      }
      if (listing.type === 'project' && listing.compensationType !== 'fixed') {
        if (data.ask === undefined || data.ask === null) {
          ctx.addIssue({
            code: 'custom',
            path: ['ask'],
            message: 'Compensation is required',
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
