import { z } from 'zod';

export const HackathonOrderDirectionSchema = z
  .enum(['asc', 'desc'])
  .default('desc');
export const HackathonNameEnum = z.enum([
  'Mobius',
  'Redacted',
  'Breakout',
  'All',
]);
export const HackathonSchema = HackathonNameEnum.default('All');
export const HackathonNameOptions = HackathonNameEnum.options;
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
