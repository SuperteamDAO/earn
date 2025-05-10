import { z } from 'zod';

export const HackathonOrderDirectionSchema = z
  .enum(['asc', 'desc'])
  .default('desc');
export const HackathonSchema = z
  .enum(['Mobius', 'Redacted', 'Breakout', 'All'])
  .default('All');
export const HackathonStatusSchema = z
  .enum(['open', 'review', 'completed'])
  .default('open');
export const HackathonSortOptionSchema = z
  .enum(['Prize', 'Submissions'])
  .default('Prize');
export const HackathonContextSchema = z.enum(['home', 'all']).default('all');

export const HackathonQueryParamsSchema = z.object({
  order: HackathonOrderDirectionSchema,
  name: HackathonSchema,
  status: HackathonStatusSchema,
  sortBy: HackathonSortOptionSchema,
  context: HackathonContextSchema,
});
