import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { getUserSession } from '@/features/auth/utils/getUserSession';

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

    const body = await request.json();
    const { type, url, id } = body;
    logger.debug(`Request body: ${safeStringify(body)}`);

    if (!type || !url || !id) {
      logger.warn('Missing required fields');
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 },
      );
    }

    if (type === 'submission') {
      const submission = await prisma.submission.findUnique({
        where: { id: id as string },
        select: { ogImage: true },
      });

      if (submission?.ogImage && submission.ogImage !== 'error') {
        logger.warn(`OG image already exists for submission ${id}`);
        return NextResponse.json({
          success: false,
          error: 'Image already exists',
        });
      }

      await prisma.submission.update({
        where: { id: id as string },
        data: { ogImage: url },
      });
    } else if (type === 'pow') {
      const pow = await prisma.poW.findUnique({
        where: { id: id as string },
        select: { ogImage: true },
      });

      if (pow?.ogImage && pow.ogImage !== 'error') {
        logger.warn(`OG image already exists for PoW ${id}`);
        return NextResponse.json({
          success: false,
          error: 'Image already exists',
        });
      }

      await prisma.poW.update({
        where: { id: id as string },
        data: { ogImage: url },
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid type provided' },
        { status: 400 },
      );
    }

    logger.info(`Successfully updated ogImage for ${type} with ID: ${id}`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error(`Error updating ogImage: ${safeStringify(error)}`);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
