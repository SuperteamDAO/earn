// used for api route, dont add use client here.

import { type Prisma } from '@prisma/client';

import { generateUniqueSlug } from '@/pages/api/listings/check-slug';

import { fetchSlugCheck } from '../queries/slug-check';

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
    | Prisma.BountiesGetPayload<{
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
