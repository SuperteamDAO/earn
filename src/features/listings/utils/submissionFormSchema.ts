import { z } from 'zod';

import { type SubmissionListing, submissionIssues } from './submissionRules';

// The submission form's schema: its fields, checked by the same rules the
// server applies (submissionRules.ts).
const submissionSchema = (
  listing: SubmissionListing,
  verifiedHandles: ReadonlyArray<string> | null | undefined,
) =>
  z
    .object({
      link: z.string().optional(),
      tweet: z.string().optional(),
      otherInfo: z.string().optional(),
      eligibilityAnswers: z
        .array(z.object({ question: z.string(), answer: z.string() }))
        .optional(),
    })
    .superRefine((data, ctx) => {
      for (const issue of submissionIssues(listing, verifiedHandles, data)) {
        ctx.addIssue({
          code: 'custom',
          path: [...issue.path],
          message: issue.message,
        });
      }
    });

export { submissionSchema };
