import type { NextApiRequest, NextApiResponse } from 'next';
import slugify from 'slugify';

import { prisma } from '@/prisma';

const checkSlug = async (slug: string): Promise<boolean> => {
  try {
    const bounty = await prisma.bounties.findFirst({
      where: {
        slug,
        isActive: true,
      },
    });

    if (bounty) {
      return true;
    }
    return false;
  } catch (error) {
    console.error(
      `Error occurred while fetching bounty with slug=${slug}.`,
      error,
    );
    return false;
  }
};

const generateUniqueSlug = async (title: string): Promise<string> => {
  let slug = slugify(title, { lower: true, strict: true });
  console.log(slug);
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
  const { slug } = req.query;

  const newSlug = await generateUniqueSlug(slug as string);

  res.status(200).json({ slug: newSlug });
}
