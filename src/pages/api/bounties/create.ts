import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
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
  const token = await getToken({ req });

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = token.id;

  if (!userId) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId as string,
    },
  });

  if (!user || !user.currentSponsorId) {
    return res
      .status(403)
      .json({ error: 'User does not have a current sponsor.' });
  }

  const { title, ...data } = req.body;
  try {
    const slug = await generateUniqueSlug(title);
    const finalData = {
      sponsorId: user.currentSponsorId,
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
    const zapierWebhookUrl = process.env.ZAPIER_BOUNTY_WEBHOOK!;
    await axios.post(zapierWebhookUrl, result);
    return res.status(200).json(result);
  } catch (error) {
    console.log('file: create.ts:31 ~ user ~ error:', error);
    return res.status(400).json({
      error,
      message: 'Error occurred while adding a new bounty.',
    });
  }
}
