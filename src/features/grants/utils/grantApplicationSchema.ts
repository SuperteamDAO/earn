import { z } from 'zod';

import { isValidTwitterInput, isValidTwitterUsername } from '@/features/talent';

export const grantApplicationSchema = (
  minReward: number,
  maxReward: number,
  token: string,
  questions?: { order: number; question: string }[],
) => {
  const baseSchema = z.object({
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
      .min(minReward, `Amount must be at least ${minReward} ${token}`)
      .max(maxReward, `Amount cannot exceed ${maxReward} ${token}`),
    walletAddress: z.string().min(1, 'Wallet address is required'),
    projectDetails: z.string().min(1, 'Project details are required'),
    projectTimeline: z.string().min(1, 'Project timeline is required'),
    proofOfWork: z.string().min(1, 'Proof of work is required'),
    milestones: z.string().min(1, 'Milestones are required'),
    kpi: z.string().min(1, 'KPI is required'),
    twitter: z
      .string()
      .refine(
        (value) => isValidTwitterInput(value) || isValidTwitterUsername(value),
        'Please enter a valid Twitter handle',
      ),
  });

  if (questions && questions.length > 0) {
    return baseSchema.extend({
      answers: z
        .array(
          z.object({
            question: z.string(),
            answer: z.string().min(1, 'Answer is required'),
          }),
        )
        .length(
          questions.length,
          `Please answer all ${questions.length} questions`,
        )
        .refine(
          (answers) =>
            answers.every((answer, index) =>
              questions[index]
                ? answer.question === questions[index].question
                : true,
            ),
          'Questions do not match the required questions',
        ),
    });
  }

  return baseSchema.extend({
    answers: z
      .array(
        z.object({
          question: z.string(),
          answer: z.string(),
        }),
      )
      .optional(),
  });
};
