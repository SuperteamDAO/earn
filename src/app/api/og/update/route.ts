import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import logger from '@/lib/logger';
import { ogImageUpdateRateLimiter } from '@/lib/ratelimit';
import { checkAndApplyRateLimitApp } from '@/lib/rateLimiterService';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { getUserSession } from '@/features/auth/utils/getUserSession';
import {
  fetchOgMetadata,
  type OgMetadataResult,
} from '@/features/og/utils/fetchOgMetadata';
import {
  getOgImageValue,
  parseOgImageUpdateRequest,
} from '@/features/og/utils/ogImageUpdate';

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
    let result: OgMetadataResult;
    let imageUrl: string;

    if (type === 'submission') {
      const submission = await prisma.submission.findUnique({
        where: { id },
        select: { link: true, ogImage: true },
      });

      if (!submission) {
        return NextResponse.json(
          { success: false, error: 'Record not found' },
          { status: 404 },
        );
      }

      if (submission?.ogImage && submission.ogImage !== 'error') {
        logger.warn(`OG image already exists for submission ${id}`);
        return NextResponse.json(
          { success: false, error: 'Image already exists' },
          { status: 409 },
        );
      }

      if (!submission.link) {
        return NextResponse.json(
          { success: false, error: 'Record has no source URL' },
          { status: 422 },
        );
      }

      result = await fetchOgMetadata(submission.link);
      imageUrl = getOgImageValue(result);
      const updateResult = await prisma.submission.updateMany({
        where: {
          id,
          OR: [{ ogImage: null }, { ogImage: 'error' }],
        },
        data: { ogImage: imageUrl },
      });

      if (updateResult.count !== 1) {
        return NextResponse.json(
          { success: false, error: 'Image already exists' },
          { status: 409 },
        );
      }
    } else {
      const pow = await prisma.poW.findUnique({
        where: { id },
        select: { link: true, ogImage: true },
      });

      if (!pow) {
        return NextResponse.json(
          { success: false, error: 'Record not found' },
          { status: 404 },
        );
      }

      if (pow?.ogImage && pow.ogImage !== 'error') {
        logger.warn(`OG image already exists for PoW ${id}`);
        return NextResponse.json(
          { success: false, error: 'Image already exists' },
          { status: 409 },
        );
      }

      result = await fetchOgMetadata(pow.link);
      imageUrl = getOgImageValue(result);
      const updateResult = await prisma.poW.updateMany({
        where: {
          id,
          OR: [{ ogImage: null }, { ogImage: 'error' }],
        },
        data: { ogImage: imageUrl },
      });

      if (updateResult.count !== 1) {
        return NextResponse.json(
          { success: false, error: 'Image already exists' },
          { status: 409 },
        );
      }
    }

    logger.info(
      `Successfully updated ogImage for ${type} with ID: ${id} and result ${safeStringify(result)}`,
    );
    return NextResponse.json({ success: true, imageUrl });
  } catch (error) {
    logger.error(`Error updating ogImage: ${safeStringify(error)}`);
    return NextResponse.json(
      { success: false, error: 'Failed to update OG image' },
      { status: 500 },
    );
  }
}
