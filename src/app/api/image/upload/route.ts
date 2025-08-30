import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

import logger from '@/lib/logger';
import { uploadImage } from '@/utils/cloudinary';
import { safeStringify } from '@/utils/safeStringify';

import { getUserSession } from '@/features/auth/utils/getUserSession';

export const runtime = 'nodejs';

const ALLOWED_FORMATS = ['jpeg', 'png', 'webp'];

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

    const body = await request.json();
    logger.debug(`Request body: ${safeStringify(body)}`);

    const { imageBase64, folder, type } = body;
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
      type === 'pfp' ? 200 : undefined,
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
