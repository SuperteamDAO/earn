import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import logger from '@/lib/logger';
import { ogImageUpdateRateLimiter } from '@/lib/ratelimit';
import { checkAndApplyRateLimitApp } from '@/lib/rateLimiterService';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { getUserSession } from '@/features/auth/utils/getUserSession';
import { fetchOgMetadata } from '@/features/og/utils/fetchOgMetadata';
import {
  getOgImageValue,
  type OgImageTarget,
  parseOgImageUpdateRequest,
} from '@/features/og/utils/ogImageUpdate';

const findOgRecord = (type: OgImageTarget, id: string) => {
  const query = {
    where: { id },
    select: { link: true, ogImage: true },
  } as const;

  return type === 'submission'
    ? prisma.submission.findUnique(query)
    : prisma.poW.findUnique(query);
};

const updateOgRecord = async (
  type: OgImageTarget,
  id: string,
  imageUrl: string,
) => {
  const update = {
    where: {
      id,
      OR: [{ ogImage: null }, { ogImage: 'error' }],
    },
    data: { ogImage: imageUrl },
  };

  const result =
    type === 'submission'
      ? await prisma.submission.updateMany(update)
      : await prisma.poW.updateMany(update);

  return result.count;
};

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const sessionResponse = await getUserSession(headersList);

    if (sessionResponse.status !== 200 || !sessionResponse.data) {
      logger.warn(`Authentication failed: ${sessionResponse.error}`);
      return NextResponse.json(
        { error: sessionResponse.error },
        { status: sessionResponse.status },
      );
    }

    const rateLimitResponse = await checkAndApplyRateLimitApp({
      limiter: ogImageUpdateRateLimiter,
      identifier: sessionResponse.data.userId,
      routeName: 'og_image_update',
    });
    if (rateLimitResponse) return rateLimitResponse;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 },
      );
    }

    const updateRequest = parseOgImageUpdateRequest(body);
    if (!updateRequest) {
      logger.warn('Invalid OG image update request');
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 },
      );
    }
    logger.debug(`OG image update: ${safeStringify(updateRequest)}`);

    const { type, id } = updateRequest;
    const record = await findOgRecord(type, id);

    if (!record) {
      return NextResponse.json(
        { success: false, error: 'Record not found' },
        { status: 404 },
      );
    }

    if (record.ogImage && record.ogImage !== 'error') {
      logger.warn(`OG image already exists for ${type} ${id}`);
      return NextResponse.json(
        { success: false, error: 'Image already exists' },
        { status: 409 },
      );
    }

    if (!record.link) {
      return NextResponse.json(
        { success: false, error: 'Record has no source URL' },
        { status: 422 },
      );
    }

    const result = await fetchOgMetadata(record.link);
    const imageUrl = getOgImageValue(result);
    const updatedCount = await updateOgRecord(type, id, imageUrl);

    if (updatedCount !== 1) {
      return NextResponse.json(
        { success: false, error: 'Image already exists' },
        { status: 409 },
      );
    }

    logger.info(`Successfully updated ogImage for ${type} with ID: ${id}`);
    return NextResponse.json({ success: true, imageUrl });
  } catch (error) {
    logger.error(`Error updating ogImage: ${safeStringify(error)}`);
    return NextResponse.json(
      { success: false, error: 'Failed to update OG image' },
      { status: 500 },
    );
  }
}
