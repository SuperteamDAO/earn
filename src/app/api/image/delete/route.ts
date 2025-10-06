import { v2 as cloudinary } from 'cloudinary';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { extractPublicIdFromUrl } from '@/utils/cloudinary';
import { IMAGE_SOURCE } from '@/utils/image';
import { safeStringify } from '@/utils/safeStringify';

import { getUserSession } from '@/features/auth/utils/getUserSession';

export const runtime = 'nodejs';

const deleteImageSchema = z.object({
  imageUrl: z.string().min(1, 'Image URL is required'),
  source: z.enum(
    [IMAGE_SOURCE.DESCRIPTION, IMAGE_SOURCE.USER, IMAGE_SOURCE.SPONSOR],
    {
      required_error: 'Source is required',
      invalid_type_error: 'Invalid source',
    },
  ),
});

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

    const rawBody = await request.json();
    logger.debug(`Request body: ${safeStringify(rawBody)}`);

    const validationResult = deleteImageSchema.safeParse(rawBody);
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

    const { imageUrl, source } = validationResult.data;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        photo: true,
        currentSponsor: {
          select: {
            logo: true,
          },
        },
      },
    });

    if (!user) {
      logger.warn(`User not found: ${userId}`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const publicId = extractPublicIdFromUrl(imageUrl);

    if (!publicId) {
      return NextResponse.json(
        { error: 'Invalid Cloudinary URL' },
        { status: 400 },
      );
    }

    if (source === IMAGE_SOURCE.DESCRIPTION) {
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
    } else if (source === IMAGE_SOURCE.USER) {
      if (user.photo !== imageUrl) {
        logger.warn(
          `Cannot delete image: Image URL does not match user photo. User photo: ${user.photo}, Requested URL: ${imageUrl}`,
        );
        return NextResponse.json(
          {
            error:
              'Cannot delete image: Image URL does not match your profile photo',
          },
          { status: 403 },
        );
      }
    } else if (source === IMAGE_SOURCE.SPONSOR) {
      if (!user.currentSponsor) {
        logger.warn(`User does not have a current sponsor: ${userId}`);
        return NextResponse.json(
          {
            error: 'Cannot delete image: You do not have a current sponsor',
          },
          { status: 403 },
        );
      }

      if (user.currentSponsor.logo !== imageUrl) {
        logger.warn(
          `Cannot delete image: Image URL does not match sponsor logo. Sponsor logo: ${user.currentSponsor.logo}, Requested URL: ${imageUrl}`,
        );
        return NextResponse.json(
          {
            error:
              'Cannot delete image: Image URL does not match your sponsor logo',
          },
          { status: 403 },
        );
      }
    }

    logger.info(
      `Image validation passed for source: ${source}. Attempting to delete image with public ID: ${publicId}`,
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
