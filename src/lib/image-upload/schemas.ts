import { z } from 'zod';

import { IMAGE_SOURCES, isGrantImageSource } from './types';

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_FILE_SIZE_LARGE = 15 * 1024 * 1024; // 15MB for event pictures

const imageSourceSchema = z.enum(IMAGE_SOURCES);

const contentTypeSchema = z.enum([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

const publicIdSchema = z
  .string()
  .min(1, 'Public ID is required')
  .max(500, 'Public ID too long')
  .regex(/^[a-zA-Z0-9_\-/]+$/, 'Public ID contains invalid characters');

export const signRequestSchema = z
  .object({
    source: imageSourceSchema,
    contentType: contentTypeSchema.optional(),
    contentLength: z.number().int().positive().optional(),
    width: z.number().int().positive().max(4096).optional(),
    height: z.number().int().positive().max(4096).optional(),
  })
  .refine(
    (data) => {
      if (data.contentLength === undefined) return true;
      const maxSize = isGrantImageSource(data.source)
        ? MAX_FILE_SIZE_LARGE
        : MAX_FILE_SIZE;
      return data.contentLength <= maxSize;
    },
    {
      message: 'File size exceeds maximum allowed',
      path: ['contentLength'],
    },
  );

export const deleteRequestSchema = z.object({
  publicId: publicIdSchema,
  source: imageSourceSchema,
});
