import type { NextApiRequest, NextApiResponse } from 'next';
import slugify from 'slugify';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { slug, check, id } = req.query;

  logger.debug(`Request query: ${safeStringify(req.query)}`);

  if (typeof slug !== 'string') {
    logger.warn('Slug is required and must be a string');
    return res
      .status(400)
      .json({ error: 'Slug is required and must be a string' });
  }

  try {
    if (check === 'true') {
      logger.debug(`Checking if slug exists: ${slug}`);
      const slugExists = await checkSlug(slug, id as string | undefined);
      if (slugExists) {
        logger.warn(`Slug ${slug} already exists`);
        return res
          .status(400)
          .json({ slugExists: true, error: 'Slug already exists' });
      } else {
        logger.info(`Slug ${slug} is available`);
        return res.status(200).json({ slugExists: false });
      }
    } else {
      logger.debug(`Generating unique slug for title: ${slug}`);
      const newSlug = await generateUniqueSlug(slug, id as string | undefined);
      logger.info(`Generated unique slug: ${newSlug}`);
      return res.status(200).json({ slug: newSlug });
    }
  } catch (error: any) {
    logger.error('Error in handler:', safeStringify(error));
    return res.status(500).json({ error: 'Internal server error' });
  }
}
