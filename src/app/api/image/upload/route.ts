import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { z } from 'zod';

import logger from '@/lib/logger';
import { uploadImage } from '@/utils/cloudinary';
import { IMAGE_SOURCE } from '@/utils/image';
import { safeStringify } from '@/utils/safeStringify';

import { getUserSession } from '@/features/auth/utils/getUserSession';

export const runtime = 'nodejs';

const ALLOWED_FORMATS = ['jpeg', 'png', 'webp'];

const uploadImageSchema = z.object({
  imageBase64: z.string().min(1, 'Image base64 is required'),
  folder: z.string().min(1, 'Folder is required'),
  source: z.enum(
    [IMAGE_SOURCE.DESCRIPTION, IMAGE_SOURCE.USER, IMAGE_SOURCE.SPONSOR],
    {
      required_error: 'Source is required',
      invalid_type_error: 'Invalid source',
    },
  ),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getUserSession(await headers());

    if (session.error || !session.data) {
      logger.warn('Unauthorized upload image request', {
        error: session.error,
        status: session.status,
      });
      return NextResponse.json(
        { error: session.error || 'Unauthorized' },
        { status: session.status || 401 },
      );
    }

    const userId = session.data.userId;
    logger.debug(`Authenticated user: ${userId}`);

    const rawBody = await request.json();
    logger.debug(`Request body: ${safeStringify(rawBody)}`);

    const validationResult = uploadImageSchema.safeParse(rawBody);
    if (!validationResult.success) {
      logger.warn(
        `Invalid request body: ${safeStringify(validationResult.error.format())}`,
      );
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: validationResult.error.format(),
        },
        { status: 400 },
      );
    }

    const { imageBase64, folder, source } = validationResult.data;
    const buffer = Buffer.from(imageBase64, 'base64');

    const metadata = await sharp(buffer).metadata();
    if (!metadata.format || !ALLOWED_FORMATS.includes(metadata.format)) {
      logger.warn(`Invalid image format detected: ${metadata.format}`);
      return NextResponse.json(
        {
          error: 'Invalid image format',
          message: `File type must be one of: ${ALLOWED_FORMATS.map((f) => `image/${f}`).join(', ')}`,
        },
        { status: 400 },
      );
    }

    const isDev = process.env.VERCEL_ENV !== 'production';
    const folderName = isDev ? `${folder}-dev` : folder;

    const url = await uploadImage(
      buffer,
      folderName,
      source === IMAGE_SOURCE.USER ? 200 : undefined,
    );

    return NextResponse.json({
      message: 'Upload successful',
      url,
    });
  } catch (error: any) {
    logger.error(`Server error: ${safeStringify(error)}`);
    return NextResponse.json(
      {
        error: 'Server error',
        details: error.message,
      },
      { status: 500 },
    );
  }
}
