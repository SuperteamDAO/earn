import { z } from 'zod';

import { isValidTwitterInput, isValidTwitterUsername } from '@/features/talent';
import { validateSolanaAddress } from '@/utils';

export const grantApplicationSchema = (
  minReward: number,
  maxReward: number,
  token: string,
  questions?: { order: number; question: string }[],
) =>
  z
    .object({
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
      walletAddress: z.string().min(1, 'Solana Wallet Address is required'),
      projectDetails: z.string().min(1, 'Project details are required'),
      projectTimeline: z.string().min(1, 'Project timeline is required'),
      proofOfWork: z.string().min(1, 'Proof of work is required'),
      milestones: z.string().min(1, 'Milestones are required'),
      kpi: z.string().min(1, 'KPI is required'),
      twitter: z
        .string()
        .refine(
          (value) =>
            isValidTwitterInput(value) || isValidTwitterUsername(value),
          'Please enter a valid Twitter handle',
        ),
      answers: z
        .array(z.object({ question: z.string(), answer: z.string() }))
        .optional(),
    })
    .superRefine((data, ctx) => {
      if (data.walletAddress) {
        const validate = validateSolanaAddress(data.walletAddress);
        if (!validate.isValid) {
          ctx.addIssue({
            code: 'custom',
            path: ['walletAddress'],
            message: 'Invalid Solana Wallet Address',
          });
        }
      }

      const hasQuestions = Array.isArray(questions) && questions.length > 0;

      if (hasQuestions) {
        if (!data.answers || data.answers.length === 0) {
          ctx.addIssue({
            code: 'custom',
            path: ['answers'],
            message: 'Answers are required for this listing',
          });
        } else {
          questions?.forEach((question, index) => {
            const answer = data.answers?.[index]?.answer;
            if (!answer || answer.trim() === '') {
              ctx.addIssue({
                code: 'custom',
                path: ['answers', index, 'answer'],
                message: `Answer for "${question.question}" is required`,
              });
            }
          });
        }
      }
    });
