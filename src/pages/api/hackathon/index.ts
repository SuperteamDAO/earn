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
    console.log(hackathon);

    if (!hackathon) {
      return res.status(404).json({ error: 'Hackathon not found.' });
    }

    const result = await prisma.bounties.findMany({
      where: {
        hackathonId: hackathon.id,
      },
      select: {
        title: true,
        token: true,
        rewardAmount: true,
        sponsor: {
          select: {
            name: true,
            slug: true,
            logo: true,
          },
        },
      },
    });
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ err: err });
  }
}
