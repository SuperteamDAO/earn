import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function getHackathon(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const params = req.query;
  const slug = params.id as string;

  try {
    const result = await prisma.bounties.findMany({
      where: {
        Hackathon: { slug },
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
