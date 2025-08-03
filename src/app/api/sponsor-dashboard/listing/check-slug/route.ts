import { type NextRequest, NextResponse } from 'next/server';

import logger from '@/lib/logger';
import { safeStringify } from '@/utils/safeStringify';

import {
  checkSlug,
  generateUniqueSlug,
} from '@/features/listing-builder/utils/getValidSlug';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  const check = searchParams.get('check');
  const id = searchParams.get('id');

  logger.debug(
    `Request query: ${safeStringify(Object.fromEntries(searchParams))}`,
  );

  if (!slug || typeof slug !== 'string') {
    logger.warn('Slug is required and must be a string');
    return NextResponse.json(
      { error: 'Slug is required and must be a string' },
      { status: 400 },
    );
  }

  try {
    if (check === 'true') {
      logger.debug(`Checking if slug exists: ${slug}`);
      const slugExists = await checkSlug(slug, id || undefined);
      if (slugExists) {
        logger.warn(`Slug ${slug} already exists`);
        return NextResponse.json(
          { slugExists: true, error: 'Slug already exists' },
          { status: 400 },
        );
      } else {
        logger.info(`Slug ${slug} is available`);
        return NextResponse.json({ slugExists: false }, { status: 200 });
      }
    } else {
      logger.debug(`Generating unique slug for title: ${slug}`);
      const newSlug = await generateUniqueSlug(slug, id || undefined);
      logger.info(`Generated unique slug: ${newSlug}`);
      return NextResponse.json({ slug: newSlug }, { status: 200 });
    }
  } catch (error: any) {
    logger.error('Error in handler:', safeStringify(error));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
