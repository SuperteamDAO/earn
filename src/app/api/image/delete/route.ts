import { v2 as cloudinary } from 'cloudinary';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { extractPublicIdFromUrl } from '@/utils/cloudinary';
import { safeStringify } from '@/utils/safeStringify';

import { getUserSession } from '@/features/auth/utils/getUserSession';

export const runtime = 'nodejs';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

    const publicId = extractPublicIdFromUrl(imageUrl);

    if (!publicId) {
      return NextResponse.json(
        { error: 'Invalid Cloudinary URL' },
        { status: 400 },
      );
    }

    logger.info(
      `Checking if image URL exists in bounty descriptions: ${imageUrl}`,
    );

    const bountyWithImage = await prisma.$queryRaw<
      Array<{ id: string; title: string }>
    >`
      SELECT id, title
      FROM Bounties
      WHERE isActive = true
        AND isArchived = false
        AND description LIKE ${`%${imageUrl}%`}
      LIMIT 1
    `.then(
      (results: Array<{ id: string; title: string }>) => results[0] || null,
    );

    if (bountyWithImage) {
      logger.warn(
        `Cannot delete image: Image is referenced in bounty "${bountyWithImage.title}" (ID: ${bountyWithImage.id})`,
      );
      return NextResponse.json(
        {
          error:
            'Cannot delete image: Image is currently being used in a bounty description',
          bountyTitle: bountyWithImage.title,
          bountyId: bountyWithImage.id,
        },
        { status: 409 },
      );
    }

    logger.info(
      `Image URL not found in any bounty descriptions. Attempting to delete image with public ID: ${publicId}`,
    );

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
