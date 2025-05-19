import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function getHackathon(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { slug } = req.query;

  if (!slug) {
    return res.status(400).json({ error: 'Slug is required' });
  }

  try {
    const result = await prisma.bounties.findMany({
      where: {
        Hackathon: { slug: slug as string },
        isPublished: true,
      },
      select: {
        title: true,
        token: true,
        rewardAmount: true,
        slug: true,
        sponsor: {
          select: {
            name: true,
            slug: true,
            logo: true,
            isVerified: true,
            st: true,
          },
        },
      },
      orderBy: {
        usdValue: 'desc',
      },
    });
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ err: err });
  }
}
