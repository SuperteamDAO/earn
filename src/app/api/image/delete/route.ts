import { v2 as cloudinary } from 'cloudinary';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import logger from '@/lib/logger';
import { safeStringify } from '@/utils/safeStringify';

import { getUserSession } from '@/features/auth/utils/getUserSession';

export const runtime = 'nodejs';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const CLOUDINARY_REGEX =
  /^.+\.cloudinary\.com\/(?:[^\/]+\/)(?:(image|video|raw)\/)?(?:(upload|fetch|private|authenticated|sprite|facebook|twitter|youtube|vimeo)\/)?(?:(?:[^_/]+_[^,/]+,?)*\/)?(?:v(\d+|\w{1,2})\/)?([^\.^\s]+)(?:\.(.+))?$/;

const extractPublicId = (link: string) => {
  if (!link) return '';

  const parts = CLOUDINARY_REGEX.exec(link);

  return parts && parts.length > 2 ? parts[parts.length - 2] : link;
};

export async function DELETE(request: NextRequest) {
  try {
    const session = await getUserSession(await headers());

    if (session.error || !session.data) {
      logger.warn('Unauthorized delete image request', {
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

    const { imageUrl } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 },
      );
    }

    const publicId = extractPublicId(imageUrl);

    if (!publicId) {
      return NextResponse.json(
        { error: 'Invalid Cloudinary URL' },
        { status: 400 },
      );
    }

    logger.info(`Attempting to delete image with public ID: ${publicId}`);

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === 'ok') {
      logger.info('Image deleted successfully');
      return NextResponse.json({
        message: 'Image deleted successfully',
      });
    } else {
      logger.error(`Failed to delete image: ${safeStringify(result)}`);
      return NextResponse.json(
        {
          error: 'Failed to delete image',
          details: result,
        },
        { status: 404 },
      );
    }
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
