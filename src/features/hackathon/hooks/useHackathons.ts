import type { z } from 'zod';

import type {
  HackathonContextSchema,
  HackathonOrderDirectionSchema,
  HackathonSortOptionSchema,
  HackathonStatusSchema,
} from '../constants/schema';

export type HackathonStatus = z.infer<typeof HackathonStatusSchema>;
export type HackathonSortOption = z.infer<typeof HackathonSortOptionSchema>;
export type HackathonOrderDirection = z.infer<
  typeof HackathonOrderDirectionSchema
>;
export type HackathonContext = z.infer<typeof HackathonContextSchema>;
