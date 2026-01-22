import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import {
  generateSignedUploadParams,
  getRateLimitHeaders,
  ImageUploadError,
  signRequestSchema,
} from '@/lib/image-upload';
import { checkRateLimit } from '@/lib/image-upload/security/rate-limiter';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { getUserSession } from '@/features/auth/utils/getUserSession';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getUserSession(await headers());

    if (session.error || !session.data) {
      logger.warn('Unauthorized image sign request', {
        error: session.error,
        status: session.status,
      });
      return NextResponse.json(
        { error: session.error || 'Unauthorized' },
        { status: session.status || 401 },
      );
    }

    const userId = session.data.userId;

    const rateLimitResult = await checkRateLimit(userId);
    const rateLimitHeaders = getRateLimitHeaders(rateLimitResult);

    if (!rateLimitResult.allowed) {
      logger.warn(`Rate limit exceeded for user ${userId}`);
      return NextResponse.json(
        {
          error: 'Too many upload requests. Please try again later.',
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: rateLimitHeaders,
        },
      );
    }

    const rawBody = await request.json();
    logger.debug(`Image sign request: ${safeStringify(rawBody)}`);

    const validationResult = signRequestSchema.safeParse(rawBody);
    if (!validationResult.success) {
      logger.warn(
        `Invalid sign request body: ${safeStringify(validationResult.error.format())}`,
      );
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: validationResult.error.format(),
        },
        { status: 400, headers: rateLimitHeaders },
      );
    }

    const { source, contentType, contentLength } = validationResult.data;

    if (source === 'description') {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          currentSponsorId: true,
          UserSponsors: {
            select: { sponsorId: true },
          },
        },
      });

      if (!user) {
        logger.warn(`User ${userId} not found for description upload`);
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404, headers: rateLimitHeaders },
        );
      }

      if (!user.currentSponsorId && user.UserSponsors.length === 0) {
        logger.warn(
          `User ${userId} attempted description upload without sponsor access`,
        );
        return NextResponse.json(
          { error: 'You do not have permission to upload listing images' },
          { status: 403, headers: rateLimitHeaders },
        );
      }
    }

    const signedParams = generateSignedUploadParams(source);

    logger.info(`Image upload signature generated for user ${userId}`, {
      source,
      contentType,
      contentLength,
    });

    return NextResponse.json(
      {
        ...signedParams,
        contentType,
        contentLength,
      },
      { headers: rateLimitHeaders },
    );
  } catch (error: unknown) {
    logger.error(`Failed to generate image signature: ${safeStringify(error)}`);

    if (error instanceof ImageUploadError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 },
      );
    }

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to generate signature: ${errorMessage}` },
      { status: 500 },
    );
  }
}
