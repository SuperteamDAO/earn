import { type InKindRewardSelect } from '@/prisma/models/InKindReward';

export const inKindRewardSelect = {
  id: true,
  slug: true,
  name: true,
  pluralName: true,
  icon: true,
} satisfies InKindRewardSelect;
