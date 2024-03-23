import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function user(req: NextApiRequest, res: NextApiResponse) {
  const params = req.query;
  const slug = params.slug as string;

  try {
    const result = await prisma.bounties.findUnique({
      where: {
        slug: slug as string,
      },
    });

    if (result) {
      // If slug is found in the database, return true
      return res.status(200).json({ slugAvailable: true });
    } else {
      // If slug is not found in the database, return false
      return res.status(200).json({ slugAvailable: false });
    }
  } catch (error) {
    return res.status(400).json({
      error,
      message: `Error occurred while fetching bounty with slug=${slug}.`,
    });
  }
}
