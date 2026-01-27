import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import {
  deleteImage,
  deleteRequestSchema,
  extractPublicIdFromUrl,
  ImageUploadError,
  UPLOAD_CONFIGS,
} from '@/lib/image-upload';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { getUserSession } from '@/features/auth/utils/getUserSession';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function escapeLikePattern(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

function validatePublicIdFolder(
  publicId: string,
  source: 'user' | 'sponsor' | 'description',
): boolean {
  const config = UPLOAD_CONFIGS[source];
  return publicId.startsWith(config.folder + '/');
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getUserSession(await headers());

    if (session.error || !session.data) {
      logger.warn('Unauthorized image delete request', {
        error: session.error,
        status: session.status,
      });
      return NextResponse.json(
        { error: session.error || 'Unauthorized' },
        { status: session.status || 401 },
      );
    }

    const userId = session.data.userId;
    logger.debug(`Authenticated user for delete: ${userId}`);

    const rawBody = await request.json();
    logger.debug(`Image delete request: ${safeStringify(rawBody)}`);

    const validationResult = deleteRequestSchema.safeParse(rawBody);
    if (!validationResult.success) {
      logger.warn(
        `Invalid delete request body: ${safeStringify(validationResult.error.format())}`,
      );
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: validationResult.error.format(),
        },
        { status: 400 },
      );
    }

    const { publicId, source } = validationResult.data;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        photo: true,
        currentSponsorId: true,
        currentSponsor: {
          select: {
            logo: true,
          },
        },
        UserSponsors: {
          select: {
            sponsorId: true,
            role: true,
          },
        },
      },
    });

    if (!user) {
      logger.warn(`User not found: ${userId}`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (source === 'description') {
      if (!validatePublicIdFolder(publicId, source)) {
        logger.warn(
          `Public ID ${publicId} does not match expected folder for source ${source}`,
        );
        return NextResponse.json(
          { error: 'Invalid public ID for the specified source' },
          { status: 400 },
        );
      }

      if (!user.currentSponsorId && user.UserSponsors.length === 0) {
        logger.warn(
          `User ${userId} attempted to delete description image without sponsor access`,
        );
        return NextResponse.json(
          { error: 'You do not have permission to delete listing images' },
          { status: 403 },
        );
      }

      const escapedPublicId = escapeLikePattern(publicId);
      const bountyWithImage = await prisma.bounties.findFirst({
        where: {
          isActive: true,
          isArchived: false,
          description: {
            contains: escapedPublicId,
          },
        },
        select: {
          id: true,
          title: true,
        },
      });

      if (bountyWithImage) {
        logger.warn(
          `Cannot delete image: Image is referenced in bounty "${bountyWithImage.title}"`,
        );
        return NextResponse.json(
          {
            error:
              'Cannot delete image: Image is currently being used in a listing description',
            bountyTitle: bountyWithImage.title,
            bountyId: bountyWithImage.id,
          },
          { status: 409 },
        );
      }
    } else if (source === 'user') {
      if (!user.photo) {
        logger.info(
          `User ${userId} attempted to delete user image but has no photo set - treating as successful no-op`,
        );
        return NextResponse.json({
          message: 'No profile photo to delete',
        });
      }

      const userPhotoPublicId = extractPublicIdFromUrl(user.photo);
      if (userPhotoPublicId !== publicId) {
        logger.warn(
          `User ${userId} attempted to delete image ${publicId} but their photo is ${userPhotoPublicId}`,
        );
        return NextResponse.json(
          {
            error:
              'Cannot delete image: Image does not match your profile photo',
          },
          { status: 403 },
        );
      }
    } else if (source === 'sponsor') {
      if (!user.currentSponsorId) {
        logger.warn(
          `User ${userId} attempted to delete sponsor image without current sponsor`,
        );
        return NextResponse.json(
          { error: 'You do not have a current sponsor' },
          { status: 403 },
        );
      }

      if (!user.currentSponsor?.logo) {
        logger.info(
          `User ${userId} attempted to delete sponsor logo but sponsor has no logo - treating as successful no-op`,
        );
        return NextResponse.json({
          message: 'No sponsor logo to delete',
        });
      }

      const sponsorLogoPublicId = extractPublicIdFromUrl(
        user.currentSponsor.logo,
      );
      if (sponsorLogoPublicId !== publicId) {
        logger.warn(
          `User ${userId} attempted to delete image ${publicId} but sponsor logo is ${sponsorLogoPublicId}`,
        );
        return NextResponse.json(
          {
            error:
              'Cannot delete image: Image does not match your sponsor logo',
          },
          { status: 403 },
        );
      }

      const hasAccess = user.UserSponsors.some(
        (us) =>
          us.sponsorId === user.currentSponsorId &&
          (us.role === 'ADMIN' || us.role === 'MEMBER'),
      );

      if (!hasAccess) {
        logger.warn(
          `User ${userId} does not have proper role to delete sponsor images`,
        );
        return NextResponse.json(
          { error: 'You do not have permission to delete sponsor images' },
          { status: 403 },
        );
      }
    }

    logger.info(`Deleting image with public ID: ${publicId}`);

    const deleted = await deleteImage(publicId);

    if (deleted) {
      logger.info(`Image deleted successfully: ${publicId}`);
      return NextResponse.json({ message: 'Image deleted successfully' });
    } else {
      logger.warn(`Failed to delete image: ${publicId}`);
      return NextResponse.json(
        { error: 'Failed to delete image - it may not exist' },
        { status: 404 },
      );
    }
  } catch (error: unknown) {
    logger.error(`Failed to delete image: ${safeStringify(error)}`);

    if (error instanceof ImageUploadError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 },
      );
    }

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Server error: ${errorMessage}` },
      { status: 500 },
    );
  }
}
