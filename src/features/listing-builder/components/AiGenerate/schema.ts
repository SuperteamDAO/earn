import { BountyType } from '@prisma/client';
import { z } from 'zod';

import { eligibilityQuestionSchema } from '../../types/schema';

export const aiGenerateFormSchema = z.object({
  type: z.nativeEnum(BountyType).default('bounty'),
  hackathonName: z.string().optional(),
  companyDescription: z
    .string()
    .min(
      50,
      'Please provide a more detailed company description (minimum 50 characters)',
    )
    .max(2500, 'Company description is too long (maximum 2500 characters)'),
  scopeOfWork: z
    .string()
    .min(
      50,
      'Please provide a more detailed scope of work (minimum 50 characters)',
    )
    .max(2500, 'Scope of work is too long (maximum 2500 characters)'),
  rewards: z
    .string()
    .min(
      10,
      'Please provide more details about rewards and podium split (minimum 10 characters)',
    )
    .max(2500, 'Rewards description is too long (maximum 2500 characters)'),
  requirements: z
    .string()
    .min(
      25,
      'Please provide more detailed requirements (minimum 25 characters)',
    )
    .max(
      2500,
      'Requirements description is too long (maximum 2500 characters)',
    ),
});

export type AiGenerateFormValues = z.infer<typeof aiGenerateFormSchema>;

export const aiGenerateResponseSchema = z.object({
  description: z.string(),
  eligibilityQuestion: eligibilityQuestionSchema,
});
export type AiGenerateResponseValue = z.infer<typeof aiGenerateResponseSchema>;
