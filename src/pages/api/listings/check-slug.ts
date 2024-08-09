import type { NextApiRequest, NextApiResponse } from 'next';
import slugify from 'slugify';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

const checkSlug = async (slug: string): Promise<boolean> => {
  try {
    const existingBounty = await prisma.bounties.findFirst({ where: { slug } });
    return Boolean(existingBounty);
  } catch (error) {
    logger.error(`Error checking slug: ${slug}`, safeStringify(error));
    throw new Error('Error checking slug');
  }
};

const generateUniqueSlug = async (title: string): Promise<string> => {
  let slug = slugify(title, { lower: true, strict: true });
  let slugExists = await checkSlug(slug);
  let i = 1;

  while (slugExists) {
    const newTitle = `${title}-${i}`;
    slug = slugify(newTitle, { lower: true, strict: true });
    slugExists = await checkSlug(slug);
    i += 1;
  }

  return slug;
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
      if (id) {
        const bounty = await prisma.bounties.findFirst({
          where: { id: id as string },
          select: { slug: true },
        });
        if (bounty?.slug === slug) {
          logger.info(`Slug ${slug} belongs to the same bounty with ID ${id}`);
          return res.status(200).json({ slugExists: false });
        }
      }
      const slugExists = await checkSlug(slug);
      if (slugExists) {
        logger.warn(`Slug ${slug} already exists`);
        return res
          .status(400)
          .json({ slugExists: true, error: 'Slug already exists' });
      } else {
        logger.info(`Slug ${slug} is available`);
        return res.status(200).json({ slugExists });
      }
    } else {
      logger.debug(`Generating unique slug for title: ${slug}`);
      const newSlug = await generateUniqueSlug(slug);
      logger.info(`Generated unique slug: ${newSlug}`);
      return res.status(200).json({ slug: newSlug });
    }
  } catch (error: any) {
    logger.error('Error in handler:', safeStringify(error));
    return res.status(500).json({ error: 'Internal server error' });
  }
}
