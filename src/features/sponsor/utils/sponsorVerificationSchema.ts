import { z } from 'zod';

import { telegramUsernameSchema } from '@/features/social/utils/schema';

export const sponsorVerificationSchema = z.object({
  superteamLead: z.string().min(1, 'This field is required'),
  fundingSource: z.string().min(1, 'This field is required'),
  telegram: telegramUsernameSchema,
  commitToDeadline: z.enum(['yes', 'no'], {
      error: (issue) => issue.input === undefined ? 'Please select an option' : undefined
}),
  listingId: z.string(),
});
