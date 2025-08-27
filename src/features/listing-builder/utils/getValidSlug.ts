// used for api route, dont add use client here.

import slugify from 'slugify';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { type BountiesGetPayload } from '@/prisma/models/Bounties';
import { safeStringify } from '@/utils/safeStringify';

import { fetchSlugCheck } from '../queries/slug-check';

export const checkSlug = async (
  slug: string,
  id?: string,
): Promise<boolean> => {
  try {
    const existingBounty = await prisma.bounties.findFirst({
      where: {
        slug,
        NOT: id ? { id } : undefined,
      },
      select: { id: true },
    });
    return !!existingBounty;
  } catch (error) {
    logger.error(`Error checking slug: ${slug}`, safeStringify(error));
    throw new Error('Error checking slug');
  }
};

export const generateUniqueSlug = async (
  title: string,
  id?: string,
): Promise<string> => {
  const baseSlug = slugify(title, { lower: true, strict: true });

  const existingSlugs = await prisma.bounties
    .findMany({
      where: {
        slug: {
          startsWith: baseSlug,
        },
        NOT: id ? { id } : undefined,
      },
      select: { slug: true },
    })
    .then((bounties) => bounties.map((bounty) => bounty.slug));

  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }

  let i = 1;
  let newSlug = '';

  do {
    newSlug = `${baseSlug}-${i}`;
    i++;
  } while (existingSlugs.includes(newSlug));

  return newSlug;
};

export async function getValidSlug({
  id,
  title,
  slug,
  listing,
}: {
  id?: string;
  title?: string;
  slug?: string;
  listing?:
    | BountiesGetPayload<{
        include: {
          sponsor: true;
        };
      }>
    | undefined;
}): Promise<string> {
  const reTitle = title || 'Untitled Draft';
  let reSlug = slug;
  if (reSlug && id && reSlug !== listing?.slug) {
    try {
      await fetchSlugCheck({
        slug: reSlug,
        id: id || undefined,
        check: true,
      });
    } catch (error) {
      // If slug is already used, fallback to previous slug
      reSlug = listing?.slug;
    }
  }
  const uniqueSlug = id
    ? reSlug
    : reSlug
      ? await generateUniqueSlug(reSlug)
      : await generateUniqueSlug(reTitle);
  return uniqueSlug || `untitled-draft-${Date.now()}`;
}
