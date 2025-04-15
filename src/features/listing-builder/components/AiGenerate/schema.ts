import { z } from 'zod';

export const aiGenerateFormSchema = z.object({
  companyDescription: z
    .string()
    .min(
      100,
      'Please provide a more detailed company description (minimum 100 characters)',
    )
    .max(2500, 'Company description is too long (maximum 2500 characters)'),
  scopeOfWork: z
    .string()
    .min(
      100,
      'Please provide a more detailed scope of work (minimum 100 characters)',
    )
    .max(2500, 'Scope of work is too long (maximum 2500 characters)'),
  rewards: z
    .string()
    .min(
      100,
      'Please provide more details about rewards and podium split (minimum 100 characters)',
    )
    .max(2500, 'Rewards description is too long (maximum 2500 characters)'),
  requirements: z
    .string()
    .min(
      100,
      'Please provide more detailed requirements (minimum 100 characters)',
    )
    .max(
      2500,
      'Requirements description is too long (maximum 2500 characters)',
    ),
});

export type AiGenerateFormValues = z.infer<typeof aiGenerateFormSchema>;
