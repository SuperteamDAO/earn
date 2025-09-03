import type { UIMessage } from 'ai';
import { z } from 'zod';

import {
  type BountyType,
  BountyType as BountyTypeEnum,
} from '@/generated/prisma/enums';

export const autoGenerateChatSchema = z.object({
  messages: z.custom<UIMessage[]>(),
  listingType: z.enum(
    Object.values(BountyTypeEnum) as [BountyType, ...BountyType[]],
  ),
  company: z.string().min(1),
  token: z.string().optional(),
  tokenUsdAmount: z.number().optional(),
  hackathonName: z.string().optional(),
});

export type AutoGenerateChatInput = z.infer<typeof autoGenerateChatSchema>;
