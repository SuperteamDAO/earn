import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import {
  deleteImage,
  deleteRequestSchema,
  extractPublicIdFromUrl,
  getImageOwnerId,
  type GrantImageSource,
  ImageUploadError,
  isGrantImageSource,
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
  source: keyof typeof UPLOAD_CONFIGS,
): boolean {
  const config = UPLOAD_CONFIGS[source];
  return publicId.startsWith(config.folder + '/');
}

function jsonContainsPublicId(value: unknown, publicId: string): boolean {
  if (!Array.isArray(value)) return false;

  return value.some((item) => {
    if (typeof item !== 'string') return false;
    return extractPublicIdFromUrl(item) === publicId;
  });
}

async function isLegacyGrantImageOwnedByUser(
  publicId: string,
  source: GrantImageSource,
  userId: string,
): Promise<boolean> {
  const tranches = await prisma.grantTranche.findMany({
    where: {
      GrantApplication: { userId },
    },
    select: {
      eventPictures: true,
      eventReceipts: true,
      aiReceipts: true,
    },
  });

  const fieldBySource = {
    'grant-event-pictures': 'eventPictures',
    'grant-event-receipts': 'eventReceipts',
    'grant-agentic-receipts': 'aiReceipts',
  } as const;
  const field = fieldBySource[source];

  return tranches.some((tranche) =>
    jsonContainsPublicId(tranche[field], publicId),
  );
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

    if (!validatePublicIdFolder(publicId, source)) {
      logger.warn(
        `Public ID ${publicId} does not match expected folder for source ${source}`,
      );
      return NextResponse.json(
        { error: 'Invalid public ID for the specified source' },
        { status: 400 },
      );
    }

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
      const isPersistedPhoto =
        !!user.photo && extractPublicIdFromUrl(user.photo) === publicId;
      const isOwnedUpload =
        !isPersistedPhoto && (await getImageOwnerId(publicId)) === userId;

      if (!isPersistedPhoto && !isOwnedUpload) {
        logger.warn(
          `User ${userId} attempted to delete a profile image they do not own`,
          { publicId },
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
      const isPersistedSponsorLogo =
        !!user.currentSponsor?.logo &&
        extractPublicIdFromUrl(user.currentSponsor.logo) === publicId;
      const isOwnedUpload =
        !isPersistedSponsorLogo && (await getImageOwnerId(publicId)) === userId;

      if (!isPersistedSponsorLogo && !isOwnedUpload) {
        logger.warn(
          `User ${userId} attempted to delete a sponsor image they do not own`,
          { publicId },
        );
        return NextResponse.json(
          {
            error:
              'Cannot delete image: Image does not match your sponsor logo',
          },
          { status: 403 },
        );
      }

      const hasAccess =
        !isPersistedSponsorLogo ||
        user.UserSponsors.some(
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
    } else if (isGrantImageSource(source)) {
      const isLegacyOwner = await isLegacyGrantImageOwnedByUser(
        publicId,
        source,
        userId,
      );
      const isMetadataOwner =
        !isLegacyOwner && (await getImageOwnerId(publicId)) === userId;

      if (!isMetadataOwner && !isLegacyOwner) {
        logger.warn(
          `User ${userId} attempted to delete a grant image they do not own`,
          { publicId, source },
        );
        return NextResponse.json(
          { error: 'You do not have permission to delete this grant image' },
          { status: 403 },
        );
      }
    } else {
      // Keep this default-deny guard even though Zod currently makes the branch
      // unreachable. It prevents future schema additions from silently gaining
      // delete access without an explicit authorization policy.
      logger.error('Image source has no deletion authorization policy', {
        source,
      });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
