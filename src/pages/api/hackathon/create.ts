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
      error,
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
    slugExists = await checkSlug(slug);
    i += 1;
  }

  return slug;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // eslint-disable-next-line unused-imports/no-unused-vars
  const { title, eligibility, hackathonSponsor, ...data } = req.body;

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

  if (!user) {
    return res
      .status(403)
      .json({ error: 'User does not have a current sponsor.' });
  }

  if (!user.hackathonId) {
    return res
      .status(403)
      .json({ error: 'User does not have a current sponsor.' });
  }

  try {
    const hackathon = await prisma.hackathon.findUnique({
      where: { id: user.hackathonId },
    });

    if (!hackathon) {
      return res.status(404).json({ error: 'Hackathon not found.' });
    }

    const slug = await generateUniqueSlug(title);

    const finalData = {
      sponsorId: hackathonSponsor,
      title,
      slug,
      hackathonId: hackathon.id,
      deadline: hackathon.deadline,
      eligibility: hackathon.eligibility,
      ...data,
    };
    const result = await prisma.bounties.create({
      data: finalData,
      include: {
        sponsor: true,
      },
    });
    if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'production') {
      const zapierWebhookUrl = process.env.ZAPIER_BOUNTY_WEBHOOK!;
      await axios.post(zapierWebhookUrl, result);
    }
    return res.status(200).json(result);
  } catch (error) {
    console.log('file: create.ts:31 ~ user ~ error:', error);
    return res.status(400).json({
      error,
      message: 'Error occurred while adding a new bounty.',
    });
  }
}
