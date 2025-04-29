import { BountyType } from '@prisma/client';
import { z } from 'zod';

import { eligibilityQuestionSchema } from '../../types/schema';

export const aiGenerateFormSchema = z.object({
  type: z.nativeEnum(BountyType).default('bounty'),
  hackathonName: z.string().optional(),
  token: z.string().optional(),
  tokenUsdAmount: z.number().optional(),
  companyDescription: z
    .string()
    .min(50, 'minimum 50 characters required')
    .max(2500, 'maximum 2500 characters allowed'),
  scopeOfWork: z
    .string()
    .min(50, 'minimum 50 characters required')
    .max(2500, 'maximum 2500 characters allowed'),
  rewards: z
    .string()
    .min(10, 'minimum 10 characters required')
    .max(2500, 'maximum 2500 characters allowed'),
  requirements: z
    .string()
    .min(25, 'minimum 25 characters required')
    .max(2500, 'maximum 2500 characters allowed'),
});

export type AiGenerateFormValues = z.infer<typeof aiGenerateFormSchema>;

export const aiGenerateResponseSchema = z.object({
  description: z.string(),
  eligibilityQuestion: eligibilityQuestionSchema,
});
export type AiGenerateResponseValue = z.infer<typeof aiGenerateResponseSchema>;
