import { z } from 'zod';

export const HackathonOrderDirectionSchema = z
  .enum(['asc', 'desc'])
  .prefault('desc');
export const HackathonSchema = z
  .enum(['Mobius', 'Redacted', 'Breakout', 'All'])
  .prefault('All');
export const HackathonStatusSchema = z
  .enum(['open', 'review', 'completed'])
  .prefault('open');
export const HackathonSortOptionSchema = z
  .enum(['Prize', 'Submissions'])
  .prefault('Prize');
export const HackathonContextSchema = z.enum(['home', 'all']).prefault('all');

export const HackathonQueryParamsSchema = z.object({
  order: HackathonOrderDirectionSchema,
  name: HackathonSchema,
  status: HackathonStatusSchema,
  sortBy: HackathonSortOptionSchema,
  context: HackathonContextSchema,
});
