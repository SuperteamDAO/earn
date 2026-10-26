import type { UIMessage } from 'ai';
import { z } from 'zod';

export const autoGenerateChatSchema = z.object({
  messages: z.custom<UIMessage[]>(),
  listingType: z.enum(['bounty', 'hackathon']),
  company: z.string().min(1),
  token: z.string().optional(),
  tokenUsdAmount: z.number().optional(),
  hackathonName: z.string().optional(),
});

export type AutoGenerateChatInput = z.infer<typeof autoGenerateChatSchema>;
