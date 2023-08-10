import axios from 'axios';
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
      error
    );
    return false;
  }
};

const generateUniqueSlug = async (title: string): Promise<string> => {
  let slug = slugify(title, { lower: true, strict: true });
  let slugExists = await checkSlug(slug);
  let i = 1;

  while (slugExists) {
    const newTitle = `${title}-${i}`;
    slug = slugify(newTitle, { lower: true, strict: true });
    // eslint-disable-next-line no-await-in-loop
    slugExists = await checkSlug(slug);
    i += 1;
  }

  return slug;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { title, ...data } = req.body;
  console.log('file: create.ts:10 ~ data:', data);
  try {
    const slug = await generateUniqueSlug(title);
    const finalData = {
      title,
      slug,
      ...data,
    };
    const result = await prisma.bounties.create({
      data: finalData,
      include: {
        sponsor: true,
      },
    });
    res.status(200).json(result);
    const zapierWebhookUrl = process.env.ZAPIER_BOUNTY_WEBHOOK!;
    await axios.post(zapierWebhookUrl, result);
  } catch (error) {
    console.log('file: create.ts:31 ~ user ~ error:', error);
    res.status(400).json({
      error,
      message: 'Error occurred while adding a new bounty.',
    });
  }
}
