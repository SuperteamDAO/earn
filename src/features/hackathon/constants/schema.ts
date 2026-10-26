import { z } from 'zod';

export const HackathonOrderDirectionSchema = z
  .enum(['asc', 'desc'])
  .default('desc');
export const HackathonStatusSchema = z
  .enum(['open', 'review', 'completed'])
  .default('open');
export const HackathonSortOptionSchema = z
  .enum(['Prize', 'Submissions'])
  .default('Prize');
export const HackathonContextSchema = z.enum(['home', 'all']).default('all');
