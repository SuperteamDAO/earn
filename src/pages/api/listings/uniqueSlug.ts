import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

const checkSlug = async (slug: string): Promise<boolean> => {
  try {
    const bounty = await prisma.bounties.findFirst({
      where: {
        slug,
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { slug } = req.query;

  const slugExists = await checkSlug(slug as string);

  if (slugExists) {
    res.status(400).json({ slugExists: true, error: 'Slug already exists' });
    return;
  }

  res.status(200).json({ slugExists });
}
