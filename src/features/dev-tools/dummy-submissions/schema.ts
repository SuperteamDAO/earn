import { z } from 'zod';

export const dummySubmissionsSchema = z.object({
  listingId: z.string(),
  count: z.number().min(1).max(30),
});

export type DummySubmissionsInput = z.input<typeof dummySubmissionsSchema>;
export type DummySubmissionsSchema = z.infer<typeof dummySubmissionsSchema>;
