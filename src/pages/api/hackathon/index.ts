import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function getHackathon(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const params = req.query;
  const hackathonSlug = params.slug as string;

  try {
    const hackathon = await prisma.hackathon.findUnique({
      where: { slug: hackathonSlug },
    });

    if (!hackathon) {
      return res.status(404).json({ error: 'Hackathon not found.' });
    }

    const result = await prisma.bounties.findMany({
      where: {
        hackathonId: hackathon.id,
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
