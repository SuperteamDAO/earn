import { z } from 'zod';

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const imageSourceSchema = z.enum([
  'user',
  'sponsor',
  'description',
  'grant-event-pictures',
  'grant-event-receipts',
]);

const contentTypeSchema = z.enum(['image/jpeg', 'image/png', 'image/webp']);

const publicIdSchema = z
  .string()
  .min(1, 'Public ID is required')
  .max(500, 'Public ID too long')
  .regex(/^[a-zA-Z0-9_\-/]+$/, 'Public ID contains invalid characters');

export const signRequestSchema = z.object({
  source: imageSourceSchema,
  contentType: contentTypeSchema.optional(),
  contentLength: z.number().int().positive().max(MAX_FILE_SIZE).optional(),
  width: z.number().int().positive().max(4096).optional(),
  height: z.number().int().positive().max(4096).optional(),
});

export const deleteRequestSchema = z.object({
  publicId: publicIdSchema,
  source: imageSourceSchema,
});
